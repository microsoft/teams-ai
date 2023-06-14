using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Orchestration;
using Microsoft.SemanticKernel.TemplateEngine;

namespace Microsoft.Bot.Builder.M365.AI.Prompt
{
    public class PromptManager<TState> : IPromptManager<TState> where TState : TurnState
    {
        private string? _promptsFolder;
        private readonly Dictionary<string, PromptTemplate> _templates;
        private readonly Dictionary<string, TemplateFunctionEntry<TState>> _functions;

        public PromptManager(string? promptsFolder = null)
        {
            if (promptsFolder != null)
            {
                _VerifyDirectoryExists(promptsFolder);
                _promptsFolder = promptsFolder;
            }

            _templates = new Dictionary<string, PromptTemplate>();
            _functions = new Dictionary<string, TemplateFunctionEntry<TState>>();
        }

        /// <inheritdoc />
        public IPromptManager<TState> AddFunction(string name, PromptFunction<TState> promptFunction, bool allowOverrides = false)
        {
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

        /// TODO: Update access modifier to be internal
        /// <summary>
        /// Renders a prompt template by name.
        /// </summary>
        /// <param name="kernel">The semantic kernel</param>
        /// <param name="turnContext">Current application turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="promptTemplate">Prompt template to render.</param>
        /// <returns>The rendered prompt template</returns>
        internal async Task<PromptTemplate> RenderPrompt(IKernel kernel, TurnContext turnContext, TState turnState, string name)
        {
            PromptTemplate promptTemplate = LoadPromptTemplate(name);

            return await RenderPrompt(kernel, turnContext, turnState, promptTemplate);
        }

        /// TODO: Update access modifier to be internal
        /// TODO: Ensure turnContext and turnState descriptions are same throughout the SDK
        /// <summary>
        /// Renders a prompt template.
        /// </summary>
        /// <param name="kernel">The semantic kernel</param>
        /// <param name="turnContext">Current application turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="promptTemplate">Prompt template to render.</param>
        /// <returns>The rendered prompt template</returns>
        public async Task<PromptTemplate> RenderPrompt(IKernel kernel, TurnContext turnContext, TState turnState, PromptTemplate promptTemplate)
        {
            // TODO: Review prompt template standards and make sure they align with SK's.
            // Convert all the `.` in variable refernces to `_` to conform to SK template rules
            // Ex. {{ $state.conversation.value }} to {{ $state_conversation_value }}
            // string updatedPrompt = _TransformPromptTemplateFormat(promptTemplate.Text);
            // string updatedPrompt = "";

            RegisterFunctionsIntoKernel(kernel, turnContext, turnState);
            SKContext context = kernel.CreateNewContext();
            LoadStateIntoContext(context, turnContext, turnState);

            PromptTemplateEngine promptRenderer = new();
            string renderedPrompt = await promptRenderer.RenderAsync(promptTemplate.Text, context);

            return new PromptTemplate(renderedPrompt, promptTemplate.Configuration);
        }

        /// <summary>
        /// Registers all the functions into the <seealso cref="SemanticKernel.IKernel"/> default skill collection.
        /// </summary>
        /// <param name="kernel">The semantic kernel</param>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        internal void RegisterFunctionsIntoKernel(IKernel kernel, TurnContext turnContext, TState turnState)
        {
            // TODO: Optimize
            foreach (var templateEntry in _functions)
            {
                // Wrap the function into an SKFunction
                SKFunctionWrapper<TState> sKFunction = new (turnContext, turnState, templateEntry.Key, this);
                kernel.RegisterCustomFunction(sKFunction);
            }
        }

        /// TODO: Update this once turn state infrastructure is implemented
        /// <summary>
        /// Loads value from turn context and turn state into context variables.
        /// </summary>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <returns>Variables that could be injected into the prompt template</returns>
        internal void LoadStateIntoContext(SKContext context, TurnContext turnContext, TState turnState)
        {
            context["input"] = turnContext.Activity.Text;
            // TODO: Load turn state 'temp' values into the context
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
