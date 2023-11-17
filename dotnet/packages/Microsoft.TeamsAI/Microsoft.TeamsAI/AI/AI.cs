using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Planner;
using System.Reflection;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Extensions.Logging;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.Utilities;
using Microsoft.Teams.AI.State;
using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.AI
{
    /// <summary>
    /// AI System.
    /// </summary>
    /// <remarks>
    /// The AI system is responsible for generating plans, moderating input and output, and
    /// generating prompts. It can be used free standing or routed to by the Application object.
    /// </remarks>
    /// <typeparam name="TState">Optional. Type of the turn state.</typeparam>
    public class AI<TState> where TState : ITurnState<Record, Record, TempState>
    {
        private readonly IActionCollection<TState> _actions;

        /// <summary>
        /// Creates an instance of the <see cref="AI{TState}"/> class.
        /// </summary>
        /// <param name="options">The options to configure.</param>
        /// <param name="loggerFactory">Optional. The logger factory to use.</param>
        public AI(AIOptions<TState> options, ILoggerFactory? loggerFactory = null)
        {
            Verify.ParamNotNull(options);

            Options = options;
            _actions = new ActionCollection<TState>();

            if (Options.Moderator == null)
            {
                Options.Moderator = new DefaultModerator<TState>();
            }

            Options.History ??= new AIHistoryOptions();

            // Import default actions
            ImportActions(new DefaultActions<TState>(loggerFactory));
        }

        /// <summary>
        /// Returns the moderator being used by the AI system.
        /// </summary>
        /// <remarks>
        /// The default moderator simply allows all messages and plans through without intercepting them.
        /// </remarks>
        public IModerator<TState> Moderator => Options.Moderator!;

        /// <summary>
        /// Returns the options for the AI system.
        /// </summary>
        public AIOptions<TState> Options { get; }

        /// <summary>
        /// Returns the planner being used by the AI system.
        /// </summary>
        public IPlanner<TState> Planner => Options.Planner;

        /// <summary>
        /// Returns the prompt manager being used by the AI system.
        /// </summary>
        public IPromptManager<TState> Prompts => Options.PromptManager;

        /// <summary>
        /// Registers a handler for a named action.
        /// </summary>
        /// <remarks>
        /// The AI systems planner returns plans that are made up of a series of commands or actions
        /// that should be performed. Registering a handler lets you provide code that should be run in
        /// response to one of the predicted actions.
        /// 
        /// Plans support a DO command which specifies the name of an action to call and an optional
        /// set of entities that should be passed to the action. The internal plan executor will call
        /// the registered handler for the action passing in the current context, state, and entities.
        /// 
        /// Additionally, the AI system itself uses actions to handle things like unknown actions,
        /// flagged input, and flagged output. You can override these actions by registering your own
        /// handler for them. The names of the built-in actions are available as static properties on
        /// the AI class.
        /// </remarks>
        /// <param name="name">The name of the action.</param>
        /// <param name="handler">The action handler function.</param>
        /// <param name="allowOverrides">Whether or not this action's properties can be overriden.</param>
        /// <returns>The current instance object.</returns>
        /// <exception cref="Exception"></exception>
        public AI<TState> RegisterAction(string name, IActionHandler<TState> handler, bool allowOverrides = false)
        {
            Verify.ParamNotNull(name);
            Verify.ParamNotNull(handler);

            if (!_actions.ContainsAction(name) || allowOverrides)
            {
                _actions.AddAction(name, handler, allowOverrides);
            }
            else
            {
                ActionEntry<TState> entry = _actions[name];
                if (entry.AllowOverrides)
                {
                    entry.Handler = handler;
                }
                else
                {
                    throw new InvalidOperationException($"Attempting to register an already existing action `{name}` that does not allow overrides.");
                }
            }

            return this;
        }

        /// <summary>
        /// Register an action into the AI module.
        /// </summary>
        /// <param name="action"></param>
        /// <returns>The current instance object.</returns>
        public AI<TState> RegisterAction(ActionEntry<TState> action)
        {
            Verify.ParamNotNull(action);

            return RegisterAction(action.Name, action.Handler, action.AllowOverrides);
        }

        /// <summary>
        /// Import a set of Actions from the given class instance. The functions must have the `Action` attribute.
        /// Once these functions are imported, the AI module will have access to these functions.
        /// </summary>
        /// <param name="instance">Instance of a class containing these functions.</param>
        /// <returns>The current instance object.</returns>
        public AI<TState> ImportActions(object instance)
        {
            Verify.ParamNotNull(instance);

            MethodInfo[] methods = instance.GetType()
                .GetMethods(BindingFlags.Static | BindingFlags.Instance | BindingFlags.Public | BindingFlags.InvokeMethod);

            // Filter out null functions
            IEnumerable<ActionEntry<TState>> functions = from method in methods select ActionEntry<TState>.FromNativeMethod(method, instance);
            List<ActionEntry<TState>> result = (from function in functions where function != null select function).ToList();

            // Fail if two functions have the same name
            HashSet<string> uniquenessCheck = new(from x in result select x.Name, StringComparer.OrdinalIgnoreCase);
            if (result.Count > uniquenessCheck.Count)
            {
                throw new InvalidOperationException("Function overloads are not supported, please differentiate function names");
            }

            // Register the actions
            result.ForEach(action => RegisterAction(action));

            return this;
        }

        /// <summary>
        /// Calls the configured planner to generate a plan and executes the plan that is returned.
        /// </summary>
        /// <remarks>
        /// The moderator is called to review the input and output of the plan. If the moderator flags
        /// the input or output then the appropriate action is called. If the moderator allows the input
        /// and output then the plan is executed.
        /// </remarks>
        /// <param name="turnContext">Current turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="startTime">Optional. Time the AI system started running.</param>
        /// <param name="stepCount">Optional. Number of steps that have been executed.</param>
        /// <returns>True if the plan was completely executed, otherwise false.</returns>
        public Task<bool> Run(ITurnContext turnContext, TState turnState, DateTime? startTime = null, int stepCount = 0)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            _SetTempStateValues(turnState, turnContext, Options);
            throw new NotImplementedException();
        }

        private void _SetTempStateValues(TState turnState, ITurnContext turnContext, AIOptions<TState>? options)
        {
            TempState? tempState = turnState.Temp;

            if (tempState != null)
            {
                if (string.IsNullOrEmpty(tempState.Input))
                {
                    tempState.Input = turnContext.Activity.Text ?? string.Empty;
                }

                if (string.IsNullOrEmpty(tempState.History) && options?.History != null && options.History.TrackHistory)
                {
                    tempState.History = ConversationHistory.ToString(turnState, options.History.MaxTokens, options.History.LineSeparator);
                }
            }
        }
    }
}
