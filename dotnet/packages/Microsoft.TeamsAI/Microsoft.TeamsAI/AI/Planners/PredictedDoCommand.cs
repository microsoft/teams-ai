using System.Text.Json.Serialization;
using Json.Schema;
using Microsoft.Teams.AI.Utilities.JsonConverters;

namespace Microsoft.Teams.AI.AI.Planners
{
    /// <summary>
    /// A predicted DO command is an action that the AI system should perform.
    /// </summary>
    public class PredictedDoCommand : IPredictedCommand
    {
        /// <summary>
        /// Type to indicate that a DO command is being returned.
        /// </summary>
        public string Type { get; } = AIConstants.DoCommand;

        /// <summary>
        /// The named action that the AI system should perform.
        /// </summary>
        [JsonPropertyName("action")]
        public string Action { get; set; }

        /// <summary>
        /// Any parameters that the AI system should use to perform the action.
        /// </summary>
        [JsonPropertyName("parameters")]
        [JsonConverter(typeof(DictionaryJsonConverter))]
        public Dictionary<string, object?>? Parameters { get; set; }

        /// <summary>
        /// Creates a new instance of the <see cref="PredictedDoCommand"/> class.
        /// </summary>
        /// <param name="action">The action name.</param>
        /// <param name="parameters">Any parameters that the AI system should use to perform the action.</param>
        public PredictedDoCommand(string action, Dictionary<string, object?> parameters)
        {
            Action = action;
            Parameters = parameters;
        }

        /// <summary>
        /// Creates a new instance of the <see cref="PredictedDoCommand"/> class.
        /// </summary>
        /// <param name="action"></param>
        [JsonConstructor]
        public PredictedDoCommand(string action)
        {
            Action = action;
            Parameters = new Dictionary<string, object?>();
        }

        /// <summary>
        /// Schema
        /// </summary>
        /// <returns></returns>
        public static JsonSchema Schema()
        {
            return new JsonSchemaBuilder()
                .Type(SchemaValueType.Object)
                .Properties(
                    (
                        "type",
                        new JsonSchemaBuilder()
                            .Type(SchemaValueType.String)
                            .Enum(new string[] { "DO" })
                    ),
                    (
                        "action",
                        new JsonSchemaBuilder()
                            .Type(SchemaValueType.String)
                    ),
                    (
                        "parameters",
                        new JsonSchemaBuilder()
                            .Type(SchemaValueType.Object)
                    )
                )
                .Required(new string[] { "type", "action" })
                .Build();
        }
    }
}
