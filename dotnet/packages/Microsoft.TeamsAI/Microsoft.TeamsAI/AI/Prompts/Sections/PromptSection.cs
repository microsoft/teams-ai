using Microsoft.Teams.AI.AI.Models;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;
using System.Text.Json;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// Rendered Prompt Section
    /// </summary>
    /// <typeparam name="TOutput"></typeparam>
    public class RenderedPromptSection<TOutput>
    {
        /// <summary>
        /// The section that was rendered.
        /// </summary>
        public TOutput Output { get; set; }

        /// <summary>
        /// The number of tokens that were rendered.
        /// </summary>
        public int Length { get; set; }

        /// <summary>
        /// If true the section was truncated because it exceeded the `maxTokens` budget.
        /// </summary>
        public bool TooLong { get; set; }

        /// <summary>
        /// Creates an instance of `RenderedPromptSection`
        /// </summary>
        /// <param name="output"></param>
        /// <param name="length"></param>
        /// <param name="tooLong"></param>
        public RenderedPromptSection(TOutput output, int length = 0, bool tooLong = false)
        {
            this.Output = output;
            this.Length = length;
            this.TooLong = tooLong;
        }
    }

    /// <summary>
    /// Base class for most prompt sections.
    /// </summary>
    public abstract class PromptSection
    {
        /// <summary>
        /// The requested token budget for this section.
        /// </summary>
        public readonly int Tokens;

        /// <summary>
        /// If true the section is mandatory otherwise it can be safely dropped.
        /// </summary>
        public readonly bool Required;

        /// <summary>
        /// Separator to use between sections when rendering as text. Defaults to `\n`.
        /// </summary>
        public readonly string Separator;

        /// <summary>
        /// Prefix to use for text output. Defaults to ``.
        /// </summary>
        public readonly string Prefix;

        /// <summary>
        /// Creates a new 'PromptSection' instance.
        /// </summary>
        /// <param name="tokens">Sizing strategy for this section. Defaults to auto.</param>
        /// <param name="required">Indicates if this section is required. Defaults to true.</param>
        /// <param name="separator">Separator to use between sections when rendering as text. Defaults to `\n`.</param>
        /// <param name="prefix">Prefix to use for text output. Defaults to ``.</param>
        public PromptSection(int tokens = -1, bool required = true, string separator = "\n", string prefix = "")
        {
            this.Tokens = tokens;
            this.Required = required;
            this.Separator = separator;
            this.Prefix = prefix;
        }

        /// <summary>
        /// Render As Messages
        /// </summary>
        /// <param name="context">context</param>
        /// <param name="memory">memory</param>
        /// <param name="functions">functions</param>
        /// <param name="tokenizer">tokenizer</param>
        /// <param name="maxTokens">max tokens</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>prompt rendered as a list of messages</returns>
        public abstract Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default);

        /// <summary>
        /// Render As Text
        /// </summary>
        /// <param name="context">context</param>
        /// <param name="memory">memory</param>
        /// <param name="functions">functions</param>
        /// <param name="tokenizer">tokenizer</param>
        /// <param name="maxTokens">max tokens</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>prompt rendered as text</returns>
        public virtual async Task<RenderedPromptSection<string>> RenderAsTextAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
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
                IReadOnlyList<int> encoded = tokenizer.Encode(text);
                text = tokenizer.Decode(encoded.Take(this.Tokens).ToList());
                length = this.Tokens;
            }

            return new(text, length, length > maxTokens);
        }

        /// <summary>
        /// Truncate Messages
        /// </summary>
        /// <param name="messages">messages to be truncated</param>
        /// <param name="tokenizer">tokenizer</param>
        /// <param name="maxTokens">max tokens</param>
        /// <returns></returns>
        protected RenderedPromptSection<List<ChatMessage>> TruncateMessages(List<ChatMessage> messages, ITokenizer tokenizer, int maxTokens)
        {
            int budget = this.Tokens > 1 ? Math.Min(this.Tokens, maxTokens) : maxTokens;
            int len = 0;
            List<ChatMessage> output = new();

            foreach (ChatMessage message in messages)
            {
                string text = this.GetMessageText(message);
                IReadOnlyList<int> encoded = tokenizer.Encode(text);

                if (len + encoded.Count > budget)
                {
                    int delta = budget - len;
                    string truncated = tokenizer.Decode(encoded.Take(delta).ToList());
                    output.Add(new(message.Role) { Content = truncated });
                    len += delta;
                    break;
                }

                len += encoded.Count;
                output.Add(message);
            }

            return new(output, len, len > budget);
        }

        /// <summary>
        /// Parse Text Content Of Message
        /// </summary>
        /// <param name="message">the message to parse</param>
        /// <returns>the parsed message text</returns>
        protected string GetMessageText(ChatMessage message)
        {
            string text = string.Empty;

            if (message.Content is IEnumerable<MessageContentParts>)
            {
                IList<MessageContentParts>? contentParts = message.GetContent<IList<MessageContentParts>>();
                foreach (MessageContentParts part in contentParts)
                {
                    if (part is TextContentPart textPart)
                    {
                        text += " " + textPart.Text;
                    }

                    // Remove the leading " "
                    text = text.TrimStart();
                }
            }
            else if (message.Content is string)
            {
                text = message.Content.ToString();
            }

            if (message.FunctionCall != null)
            {
                text = JsonSerializer.Serialize(message.FunctionCall);
            }
            else if (message.Name != null)
            {
                text = $"{message.Name} returned {text}";
            }

            return text;
        }
    }
}
