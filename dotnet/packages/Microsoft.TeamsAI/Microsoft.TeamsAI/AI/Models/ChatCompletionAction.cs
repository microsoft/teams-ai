using Json.Schema;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// An action that can be called from the chat.
    /// </summary>
    public class ChatCompletionAction
    {
        /// <summary>
        /// Name of the action to be called.
        ///
        /// Must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64.
        /// </summary>
        [JsonPropertyName("name")]
        [JsonPropertyOrder(1)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Description of what the action does.
        /// </summary>
        [JsonPropertyName("description")]
        [JsonPropertyOrder(2)]
        public string? Description { get; set; }

        /// <summary>
        /// Parameters the action accepts, described as a JSON Schema object.
        ///
        /// See [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for documentation
        /// </summary>
        [JsonPropertyName("parameters")]
        [JsonPropertyOrder(3)]
        public JsonSchema? Parameters { get; set; }

        /// <summary>
        /// Creates an instance of `ChatCompletionAction`
        /// </summary>
        /// <param name="name">Name of the action to be called.</param>
        public ChatCompletionAction(string name)
        {
            this.Name = name;
        }

        /// <summary>
        /// Creates an instance of `ChatCompletionAction`
        /// </summary>
        public ChatCompletionAction()
        {

        }

        /// <summary>
        /// Creates an instance of `ChatCompletionAction`
        /// </summary>
        /// <param name="name">Name of the action to be called.</param>
        /// <param name="description">Description of what the action does.</param>
        public ChatCompletionAction(string name, string description)
        {
            this.Name = name;
            this.Description = description;
        }

        /// <summary>
        /// Creates an instance of `ChatCompletionAction`
        /// </summary>
        /// <param name="name">Name of the action to be called.</param>
        /// <param name="description">Description of what the action does.</param>
        /// <param name="parameters">Parameters the action accepts, described as a JSON Schema object.</param>
        public ChatCompletionAction(string name, string description, JsonSchema parameters)
        {
            this.Name = name;
            this.Description = description;
            this.Parameters = parameters;
        }
    }
}
