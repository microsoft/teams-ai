using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.DataSources;
using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// A datasource section that will be rendered as a message
    /// </summary>
    public class DataSourceSection : PromptSection
    {
        private readonly IDataSource _source;

        /// <summary>
        /// Creates an instance of `DataSourceSection`
        /// </summary>
        /// <param name="dataSource">data source to render</param>
        /// <param name="tokens">number of tokens</param>
        public DataSourceSection(IDataSource dataSource, int tokens = -1) : base(tokens, true, "\n\n")
        {
            this._source = dataSource;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            int budget = this.tokens > 1 ? Math.Min(this.tokens, maxTokens) : maxTokens;
            RenderedPromptSection<string> rendered = await this._source.RenderDataAsync(context, memory, tokenizer, budget);
            List<ChatMessage> messages = new()
            {new(ChatRole.System, rendered.output)};

            return new(messages, rendered.length, rendered.tooLong);
        }
    }
}
