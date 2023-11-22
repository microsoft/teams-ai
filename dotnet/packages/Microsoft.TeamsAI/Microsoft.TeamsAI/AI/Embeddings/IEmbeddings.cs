using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// Interface for Embeddings.
    /// </summary>
    public interface IEmbeddings<TState> where TState : TurnState
    {
        /// <summary>
        ///     Creates embeddings for the given inputs using the OpenAI API.
        /// </summary>
        /// <param name="inputs">Text inputs to create embeddings for.</param>
        /// <returns>A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.</returns>
        ///
        Task<EmbeddingsResponse> CreateEmbeddings(IList<string> inputs);
    }
}
