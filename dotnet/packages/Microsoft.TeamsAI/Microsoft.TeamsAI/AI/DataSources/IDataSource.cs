using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.AI.DataSources
{
    /// <summary>
    /// A data source that can be used to render text that's added to a prompt.
    /// </summary>
    public interface IDataSource
    {
        /// <summary>
        /// Name of the data source.
        /// </summary>
        public string name { get; }

        /// <summary>
        /// Renders the data source as a string of text.
        /// </summary>
        /// <param name="context">Turn context for the current turn of conversation with the user.</param>
        /// <param name="memory">An interface for accessing state values.</param>
        /// <param name="tokenizer">Tokenizer to use when rendering the data source.</param>
        /// <param name="maxTokens">Maximum number of tokens allowed to be rendered.</param>
        /// <returns></returns>
        public Task<RenderedPromptSection<string>> RenderDataAsync(ITurnContext context, Memory.Memory memory, ITokenizer tokenizer, int maxTokens);
    }
}
