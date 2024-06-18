using Microsoft.Teams.AI.AI.Augmentations;
using Microsoft.Teams.AI.AI.Models;
using System.Runtime.Serialization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// Prompt template cached by the prompt manager.
    /// </summary>
    public class PromptTemplate
    {
        /// <summary>
        /// Name of the prompt template.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Prompt that should be rendered
        /// </summary>
        public Prompt Prompt { get; set; }

        /// <summary>
        /// Configuration settings for the prompt template.
        /// </summary>
        public PromptTemplateConfiguration Configuration { get; set; } = new();

        /// <summary>
        /// Optional list of actions the model may generate JSON inputs for.
        /// </summary>
        public List<ChatCompletionAction> Actions { get; set; } = new();

        /// <summary>
        /// Optional augmentation for the prompt template.
        /// </summary>
        public IAugmentation Augmentation { get; set; } = new DefaultAugmentation();

        /// <summary>
        /// Creates an instance of `PromptTemplate`
        /// </summary>
        /// <param name="template"></param>
        public PromptTemplate(PromptTemplate template)
        {
            this.Name = template.Name;
            this.Prompt = template.Prompt;
            this.Configuration = template.Configuration;
            this.Actions = template.Actions;
            this.Augmentation = template.Augmentation;
        }

        /// <summary>
        /// Creates an instance of `PromptTemplate`
        /// </summary>
        /// <param name="name">Name of the prompt template.</param>
        /// <param name="prompt">Prompt that should be rendered</param>
        public PromptTemplate(string name, Prompt prompt)
        {
            this.Name = name;
            this.Prompt = prompt;
        }

        /// <summary>
        /// Creates an instance of `PromptTemplate`
        /// </summary>
        /// <param name="name">Name of the prompt template.</param>
        /// <param name="prompt">Prompt that should be rendered</param>
        /// <param name="configuration">Configuration settings for the prompt template.</param>
        public PromptTemplate(string name, Prompt prompt, PromptTemplateConfiguration configuration)
        {
            this.Name = name;
            this.Prompt = prompt;
            this.Configuration = configuration;
        }
    }

    /// <summary>
    /// Serialized prompt template configuration.
    /// </summary>
    public class PromptTemplateConfiguration
    {
        /// <summary>
        /// The schema version of the prompt template. Can be '1' or '1.1'.
        /// </summary>
        [JsonPropertyName("schema")]
        [JsonPropertyOrder(1)]
        public double Schema { get; set; } = 1;

        /// <summary>
        /// Type, such as "completion", "embeddings", etc.
        /// </summary>
        [JsonPropertyName("type")]
        [JsonPropertyOrder(2)]
        public string Type { get; set; } = "completion";

        /// <summary>
        /// Completion settings for the prompt.
        /// </summary>
        [JsonPropertyName("completion")]
        [JsonPropertyOrder(3)]
        public CompletionConfiguration Completion { get; set; } = new();

        /// <summary>
        /// Augmentation settings for the prompt.
        /// </summary>
        [JsonPropertyName("augmentation")]
        [JsonPropertyOrder(4)]
        public AugmentationConfiguration Augmentation { get; set; } = new();

        /// <summary>
        /// Description of the prompts purpose.
        /// </summary>
        [JsonPropertyName("description")]
        [JsonPropertyOrder(5)]
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Array of backends (models) to use for the prompt.
        ///
        /// Passing the name of a model to use here will override the default model used by a planner.
        /// </summary>
        [JsonPropertyName("default_backends")]
        [JsonPropertyOrder(6)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        [Obsolete("Use `completion.model` instead.")]
        public List<string> DefaultBackends { get; set; } = new();

        /// <summary>
        /// Creates a prompt template configuration from JSON.
        /// </summary>
        /// <param name="json">JSON of the prompt template configuration.</param>
        /// <returns>Prompt template configuration.</returns>
        internal static PromptTemplateConfiguration FromJson(string json)
        {
            PromptTemplateConfiguration? result = JsonSerializer.Deserialize<PromptTemplateConfiguration>(json, new JsonSerializerOptions()
            {
                WriteIndented = true
            });

            if (result == null)
            {
                throw new SerializationException("Failed to deserialize prompt configuration JSON string");
            }

            return result;
        }
    }

    /// <summary>
    /// completion configuration portion of a prompt template.
    /// </summary>
    public class CompletionConfiguration
    {
        /// <summary>
        ///  Type of completion to use.
        ///  Default: CompletionType of the configured default model.
        /// </summary>
        [JsonPropertyName("completion_type")]
        [JsonPropertyOrder(1)]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public CompletionType Type { get; set; } = CompletionType.Chat;

        /// <summary>
        /// Controls the model’s tendency to repeat predictions. The frequency penalty reduces the probability
        /// of words that have already been generated. The penalty depends on how many times a word has already
        /// occurred in the prediction.
        /// Default: 0
        /// </summary>
        [JsonPropertyName("frequency_penalty")]
        [JsonPropertyOrder(2)]
        public double FrequencyPenalty { get; set; } = 0.0f;

        /// <summary>
        /// If true, the prompt will be augmented with the conversation history.
        /// Default: true
        /// </summary>
        [JsonPropertyName("include_history")]
        [JsonPropertyOrder(3)]
        public bool IncludeHistory { get; set; } = true;

        /// <summary>
        /// If true, the prompt will be augmented with the users input.
        /// Default: true
        /// </summary>
        [JsonPropertyName("include_input")]
        [JsonPropertyOrder(4)]
        public bool IncludeInput { get; set; } = true;

        /// <summary>
        /// Maximum number of tokens that can be generated.
        /// </summary>
        [JsonPropertyName("max_tokens")]
        [JsonPropertyOrder(5)]
        public int MaxTokens { get; set; } = 256;

        /// <summary>
        /// The maximum number of tokens allowed in the input.
        /// Default: 2048
        /// </summary>
        [JsonPropertyName("max_input_tokens")]
        [JsonPropertyOrder(6)]
        public int MaxInputTokens { get; set; } = 2048;

        /// <summary>
        /// Name of the model to use otherwise the configured default model is used.
        /// </summary>
        [JsonPropertyName("model")]
        [JsonPropertyOrder(7)]
        public string? Model { get; set; } = null;

        /// <summary>
        /// Lowers the probability of a word appearing if it already appeared in the predicted text.
        /// Unlike the frequency penalty, the presence penalty does not depend on the frequency at which words
        /// appear in past predictions.
        /// Default: 0
        /// </summary>
        [JsonPropertyName("presence_penalty")]
        [JsonPropertyOrder(8)]
        public double PresencePenalty { get; set; } = 0.0f;

        /// <summary>
        /// Stop sequences are optional sequences that tells the backend when to stop generating tokens.
        /// </summary>
        [JsonPropertyName("stop_sequences")]
        [JsonPropertyOrder(9)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string> StopSequences { get; set; } = new();

        /// <summary>
        /// Sampling temperature to use, between 0 and 2. Higher values will make the output more random.
        /// Lower values will make it more focused and deterministic.
        /// Default: 0
        /// </summary>
        [JsonPropertyName("temperature")]
        [JsonPropertyOrder(10)]
        public double Temperature { get; set; } = 0.0f;

        /// <summary>
        /// Cut-off of top_p probability mass of tokens to consider.
        /// For example, 0.1 means only the tokens comprising the top 10% probability mass are considered.
        /// Default: 0
        /// </summary>
        [JsonPropertyName("top_p")]
        [JsonPropertyOrder(11)]
        public double TopP { get; set; } = 0.0f;

        /// <summary>
        /// If true, the prompt will be augmented with any images uploaded by the user.
        /// Defaults to false.
        /// </summary>
        [JsonPropertyName("include_images")]
        [JsonPropertyOrder(12)]
        public bool IncludeImages { get; set; } = false;

        /// <summary>
        /// Additional data provided in the completion configuration.
        /// </summary>
        [JsonExtensionData]
        public IDictionary<string, JsonElement>? AdditionalData { get; set; } = null;

        /// <summary>
        /// Completion Type
        /// </summary>
        public enum CompletionType
        {
            /// <summary>
            /// Chat
            /// </summary>
            Chat,

            /// <summary>
            /// Text
            /// </summary>
            Text
        }
    }

    /// <summary>
    /// augmentation configuration portion of a prompt template.
    /// </summary>
    public class AugmentationConfiguration
    {
        /// <summary>
        /// The type of augmentation to use. Default: None
        /// </summary>
        [JsonPropertyName("augmentation_type")]
        [JsonPropertyOrder(1)]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public AugmentationType Type { get; set; } = AugmentationType.None;

        /// <summary>
        /// List of named data sources to augment the prompt with.
        ///
        /// For each data source, the value is the max number of tokens to use from the data source.
        /// </summary>
        [JsonPropertyName("data_sources")]
        [JsonPropertyOrder(2)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, int> DataSources { get; set; } = new();
    }
}
