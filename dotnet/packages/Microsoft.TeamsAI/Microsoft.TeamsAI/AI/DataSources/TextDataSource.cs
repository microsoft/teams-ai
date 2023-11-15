using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.Memory;

namespace Microsoft.Teams.AI.AI.DataSources
{
    /// <summary>
    /// Text Data Source
    /// </summary>
    public class TextDataSource : IDataSource
    {
        /// <summary>
        /// Name
        /// </summary>
        public string Name { get; }

        private readonly string _text;
        private List<int> _tokens = new();

        /// <summary>
        /// Creates instance of `TextDataSource`
        /// </summary>
        /// <param name="name">name</param>
        /// <param name="text">text</param>
        public TextDataSource(string name, string text)
        {
            this.Name = name;
            this._text = text;
        }

        /// <inheritdoc />
        public async Task<RenderedPromptSection<string>> RenderDataAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, int maxTokens)
        {
            if (this._tokens.Count == 0)
            {
                this._tokens = tokenizer.Encode(this._text);
            }

            if (this._tokens.Count > maxTokens)
            {
                List<int> truncated = this._tokens.Take(maxTokens).ToList();
                return await Task.FromResult(new RenderedPromptSection<string>(
                    tokenizer.Decode(truncated),
                    truncated.Count,
                    true
                ));
            }

            return await Task.FromResult(new RenderedPromptSection<string>(this._text, this._tokens.Count, false));
        }
    }
}
