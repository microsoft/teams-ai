using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Diagnostics;
using Microsoft.SemanticKernel.Orchestration;
using Microsoft.SemanticKernel.TemplateEngine.Prompt;
using Microsoft.Teams.AI.State;
using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.AI.Prompt
{
    /// <summary>
    /// The prompt manager.
    /// </summary>
    /// <typeparam name="TState">The turn state class.</typeparam>
    public class PromptManager<TState> : IPromptManager<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private string? _promptsFolder;
        private readonly Dictionary<string, PromptTemplate> _templates;
        private readonly Dictionary<string, TemplateFunctionEntry<TState>> _functions;
        private readonly Dictionary<string, string> _promptVariables;

        /// <summary>
        /// Creates a new instance of the <see cref="PromptManager{TState}"/> class.
        /// </summary>
        /// <param name="promptsFolder">The prompt folder. This should be the absolute path, for example, "C:\prompts".</param>
        /// <param name="promptVariables">Mapping to resolve prompt template variables.</param>
        public PromptManager(string? promptsFolder = null, Dictionary<string, string>? promptVariables = null)
        {
            if (promptsFolder != null)
            {
                _VerifyDirectoryExists(promptsFolder);
                _promptsFolder = promptsFolder;
            }

            _promptVariables = promptVariables ?? new Dictionary<string, string>();

            _templates = new Dictionary<string, PromptTemplate>();
            _functions = new Dictionary<string, TemplateFunctionEntry<TState>>();
        }

        /// <inheritdoc />
        public IDictionary<string, string> Variables => _promptVariables;

        /// <inheritdoc />
        public IPromptManager<TState> AddFunction(string name, PromptFunction<TState> promptFunction, bool allowOverrides = false)
        {
            Verify.ParamNotNull(name);
            Verify.ParamNotNull(promptFunction);

            if (!_functions.ContainsKey(name) || allowOverrides)
            {
                _functions[name] = new TemplateFunctionEntry<TState>(promptFunction, allowOverrides);
            }
            else
            {
                if (_functions.TryGetValue(name, out TemplateFunctionEntry<TState> entry))
                {
                    if (entry.AllowOverrides)
                    {
                        entry.Handler = promptFunction;
                    }
                    else
                    {
                        throw new InvalidOperationException($"Attempting to update a previously registered function `{name}`");
                    }
                }
            }

            return this;
        }

        /// <inheritdoc />
        public IPromptManager<TState> AddPromptTemplate(string name, PromptTemplate promptTemplate)
        {
            Verify.ParamNotNull(name);
            Verify.ParamNotNull(promptTemplate);

            if (_templates.ContainsKey(name))
            {
                throw new InvalidOperationException($"Text template `{name}` already exists.");
            }

            _templates.Add(name, promptTemplate);

            return this;
        }

        /// <inheritdoc />
        public Task<string> InvokeFunction(ITurnContext turnContext, TState turnState, string name)
        {
            Verify.ParamNotNull(turnContext);
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(name);

            if (_functions.TryGetValue(name, out TemplateFunctionEntry<TState> value))
            {
                PromptFunction<TState> handler = value.Handler;
                return handler(turnContext, turnState);
            }
            else
            {
                throw new InvalidOperationException($"Attempting to invoke an unregistered function name {name}");
            }
        }

        /// <inheritdoc />
        public PromptTemplate LoadPromptTemplate(string name)
        {
            Verify.ParamNotNull(name);

            if (_templates.TryGetValue(name, out PromptTemplate template))
            {
                return template;
            }

            if (_promptsFolder == null)
            {
                throw new InvalidOperationException($"Error while loading prompt. The prompt name `{name}` is not registered to the prompt manager and you have not supplied a valid prompts folder");
            }

            return _LoadPromptTemplateFromFile(name);
        }

        /// <inheritdoc/>
        public async Task<PromptTemplate> RenderPromptAsync(ITurnContext turnContext, TState turnState, string name)
        {
            PromptTemplate promptTemplate = LoadPromptTemplate(name);

            return await RenderPromptAsync(turnContext, turnState, promptTemplate);
        }

        /// <inheritdoc/>
        public async Task<PromptTemplate> RenderPromptAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate)
        {
            IKernel kernel = Kernel.Builder.Build();
            RegisterFunctionsIntoKernel(kernel, turnContext, turnState);
            SKContext context = kernel.CreateNewContext();
            LoadStateIntoContext(context, turnContext, turnState);

            PromptTemplateEngine promptRenderer = new();

            string? renderedPrompt;
            try
            {
                renderedPrompt = await promptRenderer.RenderAsync(promptTemplate.Text, context);
            }
            catch (SKException ex)
            {
                throw new TeamsAIException($"Failed to render prompt: ${ex.Message}", ex);
            }


            return new PromptTemplate(renderedPrompt, promptTemplate.Configuration);
        }

        /// <summary>
        /// Registers all the functions into the <seealso cref="IKernel"/> default skill collection.
        /// </summary>
        /// <param name="kernel">The semantic kernel</param>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        internal void RegisterFunctionsIntoKernel(IKernel kernel, ITurnContext turnContext, TState turnState)
        {
            // TODO: Optimize
            foreach (KeyValuePair<string, TemplateFunctionEntry<TState>> templateEntry in _functions)
            {
                // Wrap the function into an SKFunction
                SKFunctionWrapper<TState> sKFunction = new(turnContext, turnState, templateEntry.Key, this);
                kernel.RegisterCustomFunction(sKFunction);
            }
        }

        /// <summary>
        /// Loads value from turn context and turn state into context variables.
        /// </summary>
        /// <param name="context">The Semantic Kernel context</param>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <returns>Variables that could be injected into the prompt template</returns>
        internal void LoadStateIntoContext(SKContext context, ITurnContext turnContext, TState turnState)
        {
            foreach (KeyValuePair<string, string> pair in _promptVariables)
            {
                context.Variables.Set(pair.Key, pair.Value);
            }

            // Temp state values override the user configured variables
            context.Variables[TempState.OutputKey] = turnState.Temp?.Output ?? string.Empty;
            context.Variables[TempState.InputKey] = turnState.Temp?.Input ?? turnContext.Activity.Text;
            context.Variables[TempState.HistoryKey] = turnState.Temp?.History ?? string.Empty;
        }

        private PromptTemplate _LoadPromptTemplateFromFile(string name)
        {
            const string CONFIG_FILE = "config.json";
            const string PROMPT_FILE = "skprompt.txt";

            string promptFolder = Path.Combine(_promptsFolder, name);
            _VerifyDirectoryExists(promptFolder);

            // Continue only if prompt template exists
            string promptPath = Path.Combine(promptFolder, PROMPT_FILE);
            if (!File.Exists(promptPath)) { throw new InvalidOperationException($"Error while loading prompt. The `{PROMPT_FILE}` file is either invalid or missing"); }

            // Load prompt template
            string text = File.ReadAllText(promptPath);

            // Load prompt configuration. Note: the configuration is optional.
            PromptTemplateConfiguration? config;
            string configPath = Path.Combine(promptFolder, CONFIG_FILE);
            if (!File.Exists(configPath)) { throw new InvalidOperationException($"Error while loading prompt. The `{CONFIG_FILE}` file is either invalid or missing"); }

            try
            {
                config = PromptTemplateConfiguration.FromJson(File.ReadAllText(configPath));
            }
            catch (Exception ex)
            {
                throw new TeamsAIException($"Error while loading prompt. {ex.Message}");
            }

            return new PromptTemplate(text, config);
        }

        private void _VerifyDirectoryExists(string directoryPath)
        {
            if (Directory.Exists(directoryPath)) { return; }

            throw new ArgumentException($"Directory doesn't exist `{directoryPath}`");
        }
    }
}
