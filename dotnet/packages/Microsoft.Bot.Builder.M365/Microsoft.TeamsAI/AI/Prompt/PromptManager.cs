using Microsoft.TeamsAI.Exceptions;
using Microsoft.TeamsAI.Utilities;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Orchestration;
using Microsoft.SemanticKernel.TemplateEngine;
using Microsoft.TeamsAI.State;
using Microsoft.Bot.Builder;

namespace Microsoft.TeamsAI.AI.Prompt
{
    public class PromptManager<TState> : IPromptManager<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        private string? _promptsFolder;
        private readonly Dictionary<string, PromptTemplate> _templates;
        private readonly Dictionary<string, TemplateFunctionEntry<TState>> _functions;
        private readonly Dictionary<string, string> _promptVariables;

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
            Verify.ParamNotNull(name, nameof(name));
            Verify.ParamNotNull(promptFunction, nameof(promptFunction));

            if (!_functions.ContainsKey(name) || allowOverrides)
            {
                _functions[name] = new TemplateFunctionEntry<TState>(promptFunction, allowOverrides);
            } else
            {
                if (_functions.TryGetValue(name, out var entry))
                {
                    if (entry.AllowOverrides)
                    {
                        entry.Handler = promptFunction;
                    } else
                    {
                        throw new PromptManagerException($"Attempting to update a previously registered function `{name}`");
                    }
                }
            }

            return this;
        }

        /// <inheritdoc />
        public IPromptManager<TState> AddPromptTemplate(string name, PromptTemplate promptTemplate)
        {
            Verify.ParamNotNull(name, nameof(name));
            Verify.ParamNotNull(promptTemplate, nameof(promptTemplate));

            if (_templates.ContainsKey(name))
            {
                throw new PromptManagerException($"Text template `{name}` already exists.");
            }

            _templates.Add(name, promptTemplate);

            return this;
        }

        /// <inheritdoc />
        public Task<string> InvokeFunction(ITurnContext turnContext, TState turnState, string name)
        {
            Verify.ParamNotNull(turnContext, nameof(turnContext));
            Verify.ParamNotNull(turnState, nameof(turnState));
            Verify.ParamNotNull(name, nameof(name));

            if (_functions.TryGetValue(name, out TemplateFunctionEntry<TState> value))
            {
                PromptFunction<TState> handler = value.Handler;
                return handler(turnContext, turnState);
            } else
            {
                throw new PromptManagerException($"Attempting to invoke an unregistered function name {name}");
            }
        }

        /// <inheritdoc />
        public PromptTemplate LoadPromptTemplate(string name)
        {
            Verify.ParamNotNull(name, nameof(name));

            if (_templates.TryGetValue(name, out PromptTemplate template))
            {
                return template;
            }

            if (_promptsFolder == null)
            {
                throw new PromptManagerException($"Error while loading prompt. The prompt name `{name}` is not registered to the prompt manager and you have not supplied a valid prompts folder");
            }
            
            return _LoadPromptTemplateFromFile(name);
        }

        /// <inheritdoc/>
        public async Task<PromptTemplate> RenderPrompt(ITurnContext turnContext, TState turnState, string name)
        {
            PromptTemplate promptTemplate = LoadPromptTemplate(name);

            return await RenderPrompt(turnContext, turnState, promptTemplate);
        }

        /// TODO: Ensure async methods have "Async" suffix
        /// TODO: Ensure turnContext and turnState descriptions are same throughout the SDK
        /// <inheritdoc/>
        public async Task<PromptTemplate> RenderPrompt(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate)
        {
            // TODO: Review prompt template standards and make sure they align with SK's.
            // Convert all the `.` in variable refernces to `_` to conform to SK template rules
            // Ex. {{ $state.conversation.value }} to {{ $state_conversation_value }}
            // string updatedPrompt = _TransformPromptTemplateFormat(promptTemplate.Text);
            // string updatedPrompt = "";

            IKernel kernel = Kernel.Builder.Build();
            RegisterFunctionsIntoKernel(kernel, turnContext, turnState);
            SKContext context = kernel.CreateNewContext();
            LoadStateIntoContext(context, turnContext, turnState);

            PromptTemplateEngine promptRenderer = new();

            string? renderedPrompt;
            try
            {
                renderedPrompt = await promptRenderer.RenderAsync(promptTemplate.Text, context);
            } catch (TemplateException ex)
            {
                throw new PromptManagerException($"Failed to render prompt: ${ex.Message}", ex);
            }


            return new PromptTemplate(renderedPrompt, promptTemplate.Configuration);
        }

        /// <summary>
        /// Registers all the functions into the <seealso cref="SemanticKernel.IKernel"/> default skill collection.
        /// </summary>
        /// <param name="kernel">The semantic kernel</param>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        internal void RegisterFunctionsIntoKernel(IKernel kernel, ITurnContext turnContext, TState turnState)
        {
            // TODO: Optimize
            foreach (var templateEntry in _functions)
            {
                // Wrap the function into an SKFunction
                SKFunctionWrapper<TState> sKFunction = new (turnContext, turnState, templateEntry.Key, this);
                kernel.RegisterCustomFunction(sKFunction);
            }
        }

        /// <summary>
        /// Loads value from turn context and turn state into context variables.
        /// </summary>
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
            if (turnState as object is TurnState defaultTurnState)
            {
                context[TempState.OutputKey] = defaultTurnState.Temp?.Output ?? string.Empty;
                context[TempState.InputKey] = defaultTurnState.Temp?.Input ?? turnContext.Activity.Text;
                context[TempState.HistoryKey] = defaultTurnState.Temp?.History ?? string.Empty;
            }
        }

        private PromptTemplate _LoadPromptTemplateFromFile(string name)
        {
            const string CONFIG_FILE = "config.json";
            const string PROMPT_FILE = "skprompt.txt";

            var promptFolder = Path.Combine(_promptsFolder, name);
            _VerifyDirectoryExists(promptFolder);

            // Continue only if prompt template exists
            var promptPath = Path.Combine(promptFolder, PROMPT_FILE);
            if (!File.Exists(promptPath)) { throw new PromptManagerException($"Error while loading prompt. The `{PROMPT_FILE}` file is either invalid or missing"); }

            // Load prompt template
            var text = File.ReadAllText(promptPath);

            // Load prompt configuration. Note: the configuration is optional.
            PromptTemplateConfiguration? config;
            var configPath = Path.Combine(promptFolder, CONFIG_FILE);
            if (!File.Exists(configPath)) { throw new PromptManagerException($"Error while loading prompt. The `{CONFIG_FILE}` file is either invalid or missing"); }

            try
            {
                config = PromptTemplateConfiguration.FromJson(File.ReadAllText(configPath));
            }
            catch (Exception ex)
            {
                throw new PromptManagerException($"Error while loading prompt. {ex.Message}");
            }

            return new PromptTemplate(text, config);
        }

        private void _VerifyDirectoryExists(string directoryPath)
        {
            if (Directory.Exists(directoryPath)) { return; }
            
            throw new PromptManagerException($"Directory doesn't exist `{directoryPath}`");
        }
    }
}
