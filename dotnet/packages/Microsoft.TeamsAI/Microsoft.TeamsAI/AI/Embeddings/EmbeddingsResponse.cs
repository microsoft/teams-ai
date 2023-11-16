namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// Response returned by a `EmbeddingsClient`.
    /// </summary>
    public class EmbeddingsResponse
    {
        /// <summary>
        /// Status of the embeddings response.
        /// </summary>
        public EmbeddingsResponseStatus Status { get; set; }

        /// <summary>
        /// Optional. Embeddings for the given inputs.
        /// </summary>
        public IList<ReadOnlyMemory<float>>? Output { get; set; }

        /// <summary>
        /// Optional. Message when status is not equal to `success`.
        /// </summary>
        public string? Message { get; set; }
    }

    /// <summary>
    /// Status of the embeddings response.
    /// </summary>
    public enum EmbeddingsResponseStatus
    {
        /// <summary>
        /// The embeddings were successfully created.
        /// </summary>
        Success,

        /// <summary>
        /// An error occurred while creating the embeddings.
        /// </summary>
        Failure,

        /// <summary>
        /// The request was rate limited.
        /// </summary>
        RateLimited,
    }
}
