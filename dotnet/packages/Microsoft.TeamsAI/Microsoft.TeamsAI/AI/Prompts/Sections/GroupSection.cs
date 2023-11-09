using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// A group of sections that will be rendered as a single message
    /// </summary>
    public class GroupSection : LayoutSection
    {
        /// <summary>
        /// Message Role
        /// </summary>
        public readonly ChatRole role;

        /// <summary>
        /// Creates instance of `GroupSection`
        /// </summary>
        /// <param name="role">message role</param>
        /// <param name="sections">sections</param>
        /// <param name="tokens">tokens</param>
        /// <param name="required">required</param>
        /// <param name="separator">separator</param>
        /// <param name="prefix">prefix</param>
        public GroupSection(ChatRole role, List<PromptSection> sections, int tokens = -1, bool required = false, string separator = "\n", string prefix = "") : base(sections, tokens, required, separator, prefix)
        {
            this.role = role;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            RenderedPromptSection<string> rendered = await base.RenderAsTextAsync(context, memory, functions, tokenizer, maxTokens);
            List<ChatMessage> messages = new()
            {new(this.role, rendered.output)};

            return await Task.FromResult(this.TruncateMessages(messages, tokenizer, maxTokens));
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<string>> RenderAsTextAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            RenderedPromptSection<List<ChatMessage>> rendered = await this.RenderAsMessagesAsync(context, memory, functions, tokenizer, maxTokens);

            if (rendered.output.Count == 0)
            {
                return new("");
            }

            string text = string.Join(this.separator, rendered.output.Select(m => this.GetMessageText(m)));
            int prefixLength = tokenizer.Encode(this.prefix).Count;
            int separatorLength = tokenizer.Encode(this.separator).Count;
            int length = prefixLength + rendered.length + (rendered.output.Count - 1) * separatorLength;

            text = this.prefix + text;

            // truncate
            if (this.tokens > 1 && length > this.tokens)
            {
                List<int> encoded = tokenizer.Encode(text);
                text = tokenizer.Decode(encoded.Take(this.tokens).ToList());
                length = this.tokens;
            }

            return new(text, length, length > maxTokens);
        }
    }
}
