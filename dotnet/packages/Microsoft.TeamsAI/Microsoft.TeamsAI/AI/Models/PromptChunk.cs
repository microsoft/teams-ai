namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Streaming chunk passed in the `ChunkReceived` event.
    /// </summary>
    public class PromptChunk
    {
        /// <summary>
        /// Delta for the response message being buffered up.
        /// </summary>
        public ChatMessage? delta { get; set; }
    }
}
