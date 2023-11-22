using Microsoft.Teams.AI.AI.Models;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;

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
        public readonly ChatRole Role;

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
            this.Role = role;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            RenderedPromptSection<string> rendered = await base.RenderAsTextAsync(context, memory, functions, tokenizer, maxTokens, cancellationToken);
            List<ChatMessage> messages = new()
            {new(this.Role) { Content = rendered.Output }};

            return await Task.FromResult(this.TruncateMessages(messages, tokenizer, maxTokens));
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<string>> RenderAsTextAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            RenderedPromptSection<List<ChatMessage>> rendered = await this.RenderAsMessagesAsync(context, memory, functions, tokenizer, maxTokens, cancellationToken);

            if (rendered.Output.Count == 0)
            {
                return new("");
            }

            string text = string.Join(this.Separator, rendered.Output.Select(m => this.GetMessageText(m)));
            int prefixLength = tokenizer.Encode(this.Prefix).Count;
            int separatorLength = tokenizer.Encode(this.Separator).Count;
            int length = prefixLength + rendered.Length + (rendered.Output.Count - 1) * separatorLength;

            text = this.Prefix + text;

            // truncate
            if (this.Tokens > 1 && length > this.Tokens)
            {
                List<int> encoded = tokenizer.Encode(text);
                text = tokenizer.Decode(encoded.Take(this.Tokens).ToList());
                length = this.Tokens;
            }

            return new(text, length, length > maxTokens);
        }
    }
}
