﻿using Json.Schema;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.Planners
{
    /// <summary>
    /// A predicted SAY command is a response that the AI system should say.
    /// </summary>
    public class PredictedSayCommand : IPredictedCommand
    {
        /// <summary>
        /// The type to indicate that a SAY command is being returned.
        /// </summary>
        public string Type { get; } = AIConstants.SayCommand;

        /// <summary>
        /// The response that the AI system should say.
        /// </summary>
        [JsonPropertyName("response")]
        [JsonRequired]
        public string Response { get; set; }

        /// <summary>
        /// Creates a new instance of the <see cref="PredictedSayCommand"/> class.
        /// </summary>
        /// <param name="response">The response that the AI system should say.</param>
        [JsonConstructor]
        public PredictedSayCommand(string response)
        {
            Response = response;
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
                            .Enum(new string[] { "SAY" })
                    ),
                    (
                        "response",
                        new JsonSchemaBuilder()
                            .Type(SchemaValueType.String)
                    )
                )
                .Required(new string[] { "type", "response" })
                .Build();
        }
    }
}
