using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Augmentations;
using Microsoft.Teams.AI.AI.DataSources;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using System.Text.Json;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// A filesystem based prompt manager.
    ///
    /// The default prompt manager uses the file system to define prompts that are compatible with
    /// Microsoft's Semantic Kernel SDK (see: https://github.com/microsoft/semantic-kernel)
    ///
    /// Each prompt is a separate folder under a root prompts folder.The folder should contain 2 files:
    ///
    /// - "config.json": contains the prompts configuration and is a serialized instance of `PromptTemplateConfig`.
    /// - "skprompt.txt": contains the text of the prompt and supports Semantic Kernels prompt template syntax.
    /// - "functions.json": Optional.Contains a list of functions that can be invoked by the prompt.
    /// 
    /// Prompts can be loaded and used by name and new dynamically defined prompt templates can be
    /// registered with the prompt manager.
    /// </summary>
    public class PromptManager : IPromptFunctions<List<string>>, IPromptDataSources, IPromptTemplates
    {
        /// <summary>
        /// Prompt Manager Options
        /// </summary>
        public readonly PromptManagerOptions Options;

        private Dictionary<string, PromptFunction<List<string>>> _functions = new();
        private Dictionary<string, IDataSource> _dataSources = new();
        private Dictionary<string, PromptTemplate> _prompts = new();

        /// <summary>
        /// Creates an instance of `PromptManager`.
        /// </summary>
        public PromptManager()
        {
            this.Options = new();
        }

        /// <summary>
        /// Creates an instance of `PromptManager`.
        /// </summary>
        /// <param name="options">PromptManagerOptions</param>
        public PromptManager(PromptManagerOptions options)
        {
            this.Options = options;
        }

        /// <inheritdoc />
        public bool HasFunction(string name)
        {
            return this._functions.ContainsKey(name);
        }

        /// <inheritdoc />
        public PromptFunction<List<string>>? GetFunction(string name)
        {
            return this.HasFunction(name) ? this._functions[name] : null;
        }

        /// <inheritdoc />
        public void AddFunction(string name, PromptFunction<List<string>> func)
        {
            this._functions[name] = func;
        }

        /// <inheritdoc />
        public async Task<dynamic?> InvokeFunctionAsync(string name, ITurnContext context, IMemory memory, ITokenizer tokenizer, List<string> args, CancellationToken cancellationToken = default)
        {
            PromptFunction<List<string>>? func = this.GetFunction(name);

            if (func != null)
            {
                return await func(context, memory, this, tokenizer, args);
            }

            return null;
        }

        /// <inheritdoc />
        public bool HasDataSource(string name)
        {
            return this._dataSources.ContainsKey(name);
        }

        /// <inheritdoc />
        public IDataSource? GetDataSource(string name)
        {
            return this.HasDataSource(name) ? this._dataSources[name] : null;
        }

        /// <inheritdoc />
        public void AddDataSource(string name, IDataSource dataSource)
        {
            this._dataSources[name] = dataSource;
        }

        /// <inheritdoc />
        public bool HasPrompt(string name)
        {
            return this._prompts.ContainsKey(name);
        }

        /// <inheritdoc />
        public void AddPrompt(string name, PromptTemplate prompt)
        {
            this._prompts[name] = prompt;
        }

        /// <inheritdoc />
        public PromptTemplate GetPrompt(string name)
        {
            PromptTemplate? template = this.HasPrompt(name) ? this._prompts[name] : null;

            if (template == null)
            {
                template = this.AppendAugmentations(this._LoadPromptTemplateFromFile(name));

                if (template.Configuration.Completion.IncludeHistory)
                {
                    template.Prompt.AddSection(new ConversationHistorySection(
                        $"conversation.{name}_history",
                        this.Options.MaxConversationHistoryTokens
                    ));
                }

                if (template.Configuration.Completion.IncludeImages)
                {
                    template.Prompt.AddSection(new UserInputMessageSection(Options.MaxInputTokens));
                }
                else if (template.Configuration.Completion.IncludeInput)
                {
                    template.Prompt.AddSection(new UserMessageSection(
                        "{{$temp.input}}",
                        this.Options.MaxInputTokens
                    ));
                }

                this._prompts[name] = template;
            }

            return template;
        }

        private PromptTemplate AppendAugmentations(PromptTemplate template)
        {
            Dictionary<string, int> dataSources = template.Configuration.Augmentation.DataSources;

            foreach (string name in dataSources.Keys)
            {
                IDataSource? dataSource = this.GetDataSource(name);

                if (dataSource == null)
                {
                    throw new ApplicationException($"DataSource '{name}' not found for prompt '{template.Name}'.");
                }

                int tokens = Math.Max(dataSources[name], 2);
                template.Prompt.AddSection(new DataSourceSection(dataSource, tokens));
            }

            switch (template.Configuration.Augmentation.Type)
            {
                case AugmentationType.Monologue:
                    template.Augmentation = new MonologueAugmentation(template.Actions);
                    break;
                case AugmentationType.Sequence:
                    template.Augmentation = new SequenceAugmentation(template.Actions);
                    break;
            }

            if (template.Augmentation != null)
            {
                PromptSection? section = template.Augmentation.CreatePromptSection();

                if (section != null)
                {
                    template.Prompt.AddSection(section);
                }
            }

            return template;
        }

        private PromptTemplate _LoadPromptTemplateFromFile(string name)
        {
            const string ACTIONS_FILE = "actions.json";
            const string CONFIG_FILE = "config.json";
            const string PROMPT_FILE = "skprompt.txt";

            string promptFolder = Path.Combine(this.Options.PromptFolder, name);
            _VerifyDirectoryExists(promptFolder);

            // Continue only if prompt template exists
            string promptPath = Path.Combine(promptFolder, PROMPT_FILE);

            if (!File.Exists(promptPath))
            {
                throw new InvalidOperationException($"Error while loading prompt. The `{PROMPT_FILE}` file is either invalid or missing");
            }

            // Load prompt template
            string text = File.ReadAllText(promptPath);
            Prompt prompt = new(new() { new TemplateSection(text, this.Options.Role) });

            // Load prompt configuration. Note: the configuration is optional.
            PromptTemplateConfiguration? config;
            string configPath = Path.Combine(promptFolder, CONFIG_FILE);

            if (!File.Exists(configPath))
            {
                throw new InvalidOperationException($"Error while loading prompt. The `{CONFIG_FILE}` file is either invalid or missing");
            }

            List<ChatCompletionAction> actions = new();
            string actionsPath = Path.Combine(promptFolder, ACTIONS_FILE);

            try
            {
                config = PromptTemplateConfiguration.FromJson(File.ReadAllText(configPath));

                if (File.Exists(actionsPath))
                {
                    actions = JsonSerializer.Deserialize<List<ChatCompletionAction>>(File.ReadAllText(actionsPath)) ?? new();
                }
            }
            catch (Exception ex)
            {
                throw new TeamsAIException($"Error while loading prompt. {ex.Message}");
            }

            return new PromptTemplate(name, prompt, config)
            {
                Actions = actions
            };
        }

        private void _VerifyDirectoryExists(string directoryPath)
        {
            if (Directory.Exists(directoryPath)) { return; }

            throw new ArgumentException($"Directory doesn't exist `{directoryPath}`");
        }
    }
}
