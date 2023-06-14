using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.SemanticKernel;

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
                throw new ArgumentException($"Text template `{name}` already exists.");
            }

            // TODO: Review prompt template standards and make sure they align with SK's
            // convert all the `.` in variable refernces to `_` to conform to SK template rules
            // Ex. {{ $state.conversation.value }} to {{ $state_conversation_value }}
            // string updatedPrompt = _TransformPromptTemplateFormat(promptTemplate.Text);
            // string updatedPrompt = "";

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

            return new PromptTemplate(name, text, config);
        }

        private void _VerifyDirectoryExists(string directoryPath)
        {
            if (Directory.Exists(directoryPath)) { return; }

            throw new Exception($"Directory doesn't exist `{directoryPath}`");
        }
    }
}
