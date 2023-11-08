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
    public class AI<TState> where TState : ITurnState<StateBase, StateBase, TempState>
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
        /// Chains into another prompt and executes the plan that is returned.
        /// </summary>
        /// <remarks>
        /// This method is used to chain into another prompt. It will call the prompt manager to
        /// get the plan for the prompt and then execute the plan. The return value indicates whether
        /// that plan was completely executed or not, and can be used to make decisions about whether the
        /// outer plan should continue executing.
        /// </remarks>
        /// <param name="turnContext">Current turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="prompt">Optional. Prompt name or prompt template to use. If omitted, the AI systems default prompt will be used.</param>
        /// <param name="options">Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>True if the plan was completely executed, otherwise false.</returns>
        /// <exception cref="InvalidOperationException">This exception is thrown when an unknown (not  DO or SAY) command is predicted.</exception>
        public async Task<bool> ChainAsync(ITurnContext turnContext, TState turnState, string? prompt = null, AIOptions<TState>? options = null, CancellationToken cancellationToken = default)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);

            AIOptions<TState> aIOptions = _ConfigureOptions(options);

            // Select prompt
            if (prompt == null)
            {
                if (aIOptions.Prompt == null)
                {
                    throw new InvalidOperationException("AI.ChainAsync() was called without a prompt and no default prompt was configured.");
                }
                else
                {
                    prompt = aIOptions.Prompt;
                }
            }

            _SetTempStateValues(turnState, turnContext, aIOptions);

            // Render the prompt
            PromptTemplate renderedPrompt = await aIOptions.PromptManager.RenderPromptAsync(turnContext, turnState, prompt);

            return await ChainAsync(turnContext, turnState, renderedPrompt, aIOptions, cancellationToken);
        }

        /// <summary>
        /// Chains into another prompt and executes the plan that is returned.
        /// </summary>
        /// <remarks>
        /// This method is used to chain into another prompt. It will call the prompt manager to
        /// get the plan for the prompt and then execute the plan. The return value indicates whether
        /// that plan was completely executed or not, and can be used to make decisions about whether the
        /// outer plan should continue executing.
        /// </remarks>
        /// <param name="turnContext">Current turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="prompt">Optional. Prompt template to use.</param>
        /// <param name="options">Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>True if the plan was completely executed, otherwise false.</returns>
        /// <exception cref="InvalidOperationException">This exception is thrown when an unknown (not  DO or SAY) command is predicted.</exception>
        public async Task<bool> ChainAsync(ITurnContext turnContext, TState turnState, PromptTemplate prompt, AIOptions<TState>? options = null, CancellationToken cancellationToken = default)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(prompt);

            AIOptions<TState> opts = _ConfigureOptions(options);

            _SetTempStateValues(turnState, turnContext, opts);

            // Render the prompt
            PromptTemplate renderedPrompt = await opts.PromptManager.RenderPromptAsync(turnContext, turnState, prompt);

            // Review prompt
            Plan? plan = await opts.Moderator!.ReviewPrompt(turnContext, turnState, renderedPrompt);

            if (plan == null)
            {
                // Generate plan
                plan = await opts.Planner.GeneratePlanAsync(turnContext, turnState, renderedPrompt, opts, cancellationToken);
                plan = await opts.Moderator.ReviewPlan(turnContext, turnState, plan);
            }

            // Process generated plan
            bool continueChain = await this._actions[AIConstants.PlanReadyActionName]!.Handler.PerformAction(turnContext, turnState, plan);
            if (continueChain)
            {
                // Update conversation history
                if (turnState != null && opts?.History != null && opts.History.TrackHistory)
                {
                    string userPrefix = opts.History!.UserPrefix.Trim();
                    string userInput = turnState.Temp!.Input.Trim();
                    int doubleMaxTurns = opts.History.MaxTurns * 2;

                    ConversationHistory.AddLine(turnState, $"{userPrefix} {userInput}", doubleMaxTurns);
                    string assistantPrefix = Options.History!.AssistantPrefix.Trim();

                    switch (opts?.History.AssistantHistoryType)
                    {
                        case AssistantHistoryType.Text:
                            // Extract only the things the assistant has said
                            string text = string.Join("\n", plan.Commands
                                .OfType<PredictedSayCommand>()
                                .Select(c => c.Response));

                            ConversationHistory.AddLine(turnState, $"{assistantPrefix}, {text}");

                            break;

                        case AssistantHistoryType.PlanObject:
                        default:
                            // Embed the plan object to re-enforce the model
                            // TODO: Add support for XML as well
                            ConversationHistory.AddLine(turnState, $"{assistantPrefix} {plan.ToJsonString()}");
                            break;
                    }

                }
            }

            for (int i = 0; i < plan.Commands.Count && continueChain; i++)
            {
                IPredictedCommand command = plan.Commands[i];

                if (command is PredictedDoCommand doCommand)
                {
                    if (_actions.ContainsAction(doCommand.Action))
                    {
                        DoCommandActionData<TState> data = new()
                        {
                            PredictedDoCommand = doCommand,
                            Handler = _actions[doCommand.Action].Handler
                        };

                        // Call action handler
                        continueChain = await this._actions[AIConstants.DoCommandActionName]
                            .Handler
                            .PerformAction(turnContext, turnState!, data, doCommand.Action);
                    }
                    else
                    {
                        // Redirect to UnknownAction handler
                        continueChain = await this._actions[AIConstants.UnknownActionName]
                            .Handler
                            .PerformAction(turnContext, turnState!, plan, doCommand.Action);
                    }
                }
                else if (command is PredictedSayCommand sayCommand)
                {
                    continueChain = await this._actions[AIConstants.SayCommandActionName]
                        .Handler
                        .PerformAction(turnContext, turnState!, sayCommand, AIConstants.SayCommandActionName);
                }
                else
                {
                    throw new InvalidOperationException($"Unknown command of {command.Type} predicted");
                }
            }

            return continueChain;
        }

        /// <summary>
        /// A helper method to complete a prompt using the configured prompt manager.
        /// </summary>
        /// <param name="turnContext">Current turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="promptTemplate">Prompt template to use.</param>
        /// <param name="options">Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        public async Task<string> CompletePromptAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate, AIOptions<TState>? options, CancellationToken cancellationToken)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(promptTemplate);

            // Configure options
            AIOptions<TState> aiOptions = _ConfigureOptions(options);
            _SetTempStateValues(turnState, turnContext, aiOptions);

            // Render the prompt
            PromptTemplate renderedPrompt = await aiOptions.PromptManager.RenderPromptAsync(turnContext, turnState, promptTemplate);

            // Complete the prompt
            return await aiOptions.Planner.CompletePromptAsync(turnContext, turnState, renderedPrompt, aiOptions, cancellationToken);
        }

        /// <summary>
        /// A helper method to complete a prompt using the configured prompt manager.
        /// </summary>
        /// <param name="turnContext">Current turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="name">Prompt name to use</param>
        /// <param name="options">Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        public async Task<string> CompletePromptAsync(ITurnContext turnContext, TState turnState, string name, AIOptions<TState>? options, CancellationToken cancellationToken)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(name);

            // Configure options
            AIOptions<TState> aiOptions = _ConfigureOptions(options);
            _SetTempStateValues(turnState, turnContext, aiOptions);

            // Render the prompt
            PromptTemplate renderedPrompt = await aiOptions.PromptManager.RenderPromptAsync(turnContext, turnState, name);

            // Complete the prompt
            return await aiOptions.Planner.CompletePromptAsync(turnContext, turnState, renderedPrompt, aiOptions, cancellationToken);
        }

        /// <summary>
        /// Creates a semantic function that can be registered with the app's prompt manager.
        /// </summary>
        /// <remarks>
        /// Semantic functions are functions that make model calls and return their results as template
        /// parameters to other prompts. For example, you could define a semantic function called
        /// 'translator' that first translates the user's input to English before calling your main prompt:
        /// <br/><br/>
        /// <c>
        /// app.AI.Prompts.AddFunction('translator', app.AI.CreateSemanticFunction('translator-prompt'));
        /// </c>
        /// <br/><br/>
        /// You would then create a prompt called "translator-prompt" that does the translation and then in
        /// your main prompt you can call it using the template expression `{{translator}}`.
        /// </remarks>
        /// <param name="name">Prompt to use. If template is provided then this name will be assigned to it in the prompt manager.</param>
        /// <param name="template">Optional. Prompt template to use.</param>
        /// <param name="options">Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.</param>
        /// <returns>A prompt function.</returns>
        public PromptFunction<TState> CreateSemanticFunction(string name, PromptTemplate? template, AIOptions<TState>? options)
        {
            Verify.ParamNotNull(name);

            if (template != null)
            {
                Options.PromptManager.AddPromptTemplate(name, template);
            }

            return (ITurnContext turnContext, TState turnState) => CompletePromptAsync(turnContext, turnState, name, options, default);
        }

        private AIOptions<TState> _ConfigureOptions(AIOptions<TState>? options)
        {
            AIOptions<TState> configuredOptions;

            if (options != null)
            {
                configuredOptions = options;

                // Disable history tracking by default
                options.History ??= new AIHistoryOptions() { TrackHistory = false };
            }
            else
            {
                configuredOptions = Options;
            }

            return configuredOptions;
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
