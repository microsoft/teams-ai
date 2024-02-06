namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// An AI model that can be used to create embeddings.
    /// </summary>
    public interface IEmbeddingsModel
    {
        /// <summary>
        /// Creates embeddings for the given inputs.
        /// </summary>
        /// <param name="inputs">Text inputs to create embeddings for.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.</returns>
        ///
        Task<EmbeddingsResponse> CreateEmbeddingsAsync(IList<string> inputs, CancellationToken cancellationToken = default);
    }
}
