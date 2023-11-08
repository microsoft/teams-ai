using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.Planner
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
    }

}
