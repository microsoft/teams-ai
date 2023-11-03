﻿using Microsoft.SemanticKernel.SemanticFunctions;
using System.Runtime.Serialization;
using System.Text.Json;
using System.Text.Json.Serialization;
using static Microsoft.SemanticKernel.SemanticFunctions.PromptTemplateConfig;

namespace Microsoft.Teams.AI.AI.Prompt
{
    /// <summary>
    /// Prompt template configuration.
    /// </summary>
    public class PromptTemplateConfiguration
    {
        /// <summary>
        /// Completion configuration parameters.
        /// </summary>
        public class CompletionConfiguration
        {
            /// <summary>
            /// Sampling temperature to use, between 0 and 2. Higher values will make the output more random.
            /// Lower values will make it more focused and deterministic.
            /// </summary>
            [JsonPropertyName("temperature")]
            [JsonPropertyOrder(1)]
            public double Temperature { get; set; } = 0.0f;

            /// <summary>
            /// Cut-off of top_p probability mass of tokens to consider.
            /// For example, 0.1 means only the tokens comprising the top 10% probability mass are considered.
            /// </summary>
            [JsonPropertyName("top_p")]
            [JsonPropertyOrder(2)]
            public double TopP { get; set; } = 0.0f;

            /// <summary>
            /// Lowers the probability of a word appearing if it already appeared in the predicted text.
            /// Unlike the frequency penalty, the presence penalty does not depend on the frequency at which words
            /// appear in past predictions.
            /// </summary>
            [JsonPropertyName("presence_penalty")]
            [JsonPropertyOrder(3)]
            public double PresencePenalty { get; set; } = 0.0f;

            /// <summary>
            /// Controls the model’s tendency to repeat predictions. The frequency penalty reduces the probability
            /// of words that have already been generated. The penalty depends on how many times a word has already
            /// occurred in the prediction.
            /// </summary>
            [JsonPropertyName("frequency_penalty")]
            [JsonPropertyOrder(4)]
            public double FrequencyPenalty { get; set; } = 0.0f;

            /// <summary>
            /// Maximum number of tokens that can be generated.
            /// </summary>
            [JsonPropertyName("max_tokens")]
            [JsonPropertyOrder(5)]
            public int MaxTokens { get; set; } = 256;

            /// <summary>
            /// Stop sequences are optional sequences that tells the backend when to stop generating tokens.
            /// </summary>
            [JsonPropertyName("stop_sequences")]
            [JsonPropertyOrder(6)]
            public List<string> StopSequences { get; set; } = new();
        }

        /// <summary>
        /// Input parameter for semantic functions.
        /// </summary>
        public class InputParameterValues
        {
            /// <summary>
            /// Name of the parameter to pass to the function.
            /// e.g. when using "{{$input}}" the name is "input", when using "{{$style}}" the name is "style", etc.
            /// </summary>
            [JsonPropertyName("name")]
            [JsonPropertyOrder(1)]
            public string Name { get; set; } = string.Empty;

            /// <summary>
            /// Parameter description for UI apps and planner. Localization is not supported here.
            /// </summary>
            [JsonPropertyName("description")]
            [JsonPropertyOrder(2)]
            public string Description { get; set; } = string.Empty;

            /// <summary>
            /// Default value when nothing is provided.
            /// </summary>
            [JsonPropertyName("defaultValue")]
            [JsonPropertyOrder(3)]
            public string DefaultValue { get; set; } = string.Empty;
        }

        /// <summary>
        /// Input configuration (list of all input parameters for a semantic function).
        /// </summary>
        public class InputConfig
        {
            /// <summary>
            /// List of all input parameters for a semantic function.
            /// </summary>
            [JsonPropertyName("parameters")]
            [JsonPropertyOrder(1)]
            public List<InputParameterValues> Parameters { get; set; } = new();
        }

        /// <summary>
        /// Schema - Not currently used.
        /// </summary>
        [JsonPropertyName("schema")]
        [JsonPropertyOrder(1)]
        public int Schema { get; set; } = 1;

        /// <summary>
        /// Type, such as "completion", "embeddings", etc.
        /// </summary>
        /// <remarks>TODO: use enum</remarks>
        [JsonPropertyName("type")]
        [JsonPropertyOrder(2)]
        public string Type { get; set; } = "completion";

        /// <summary>
        /// Description
        /// </summary>
        [JsonPropertyName("description")]
        [JsonPropertyOrder(3)]
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Completion configuration parameters.
        /// </summary>
        [JsonPropertyName("completion")]
        [JsonPropertyOrder(4)]
        public CompletionConfiguration Completion { get; set; } = new();

        /// <summary>
        /// Default backends to use.
        /// </summary>
        [JsonPropertyName("default_backends")]
        [JsonPropertyOrder(5)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string> DefaultBackends { get; set; } = new();

        /// <summary>
        /// Input configuration (that is, list of all input parameters).
        /// </summary>
        [JsonPropertyName("input")]
        [JsonPropertyOrder(6)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public InputConfig Input { get; set; } = new();


        /// <summary>
        /// Creates a semantic kernel prompt configuration
        /// </summary>
        /// <returns>Semantic Kernel's prompt template configuration</returns>
        internal PromptTemplateConfig GetPromptTemplateConfig()
        {
            return new PromptTemplateConfig()
            {
                Schema = Schema,
                Type = Type,
                Description = Description,
                Completion =
                {
                    Temperature = Completion.Temperature,
                    TopP = Completion.TopP,
                    PresencePenalty = Completion.PresencePenalty,
                    FrequencyPenalty = Completion.FrequencyPenalty,
                    MaxTokens = Completion.MaxTokens,
                    StopSequences = Completion.StopSequences,
                },
                DefaultServices = DefaultBackends,
                Input =
                {
                    Parameters = Input.Parameters.ConvertAll((inputParameterValues) => new InputParameter
                    {
                        Name = inputParameterValues.Name,
                        Description = inputParameterValues.Description,
                        DefaultValue = inputParameterValues.DefaultValue,
                    })
                }
            };
        }

        /// <summary>
        /// Creates a prompt template configuration from JSON.
        /// </summary>
        /// <param name="json">JSON of the prompt template configuration.</param>
        /// <returns>Prompt template configuration.</returns>
        internal static PromptTemplateConfiguration FromJson(string json)
        {
            PromptTemplateConfiguration? result = JsonSerializer.Deserialize<PromptTemplateConfiguration>(json);

            if (result == null)
            {
                throw new SerializationException("Failed to deserialize prompt configuration JSON string");
            }

            return result;
        }
    }
}
