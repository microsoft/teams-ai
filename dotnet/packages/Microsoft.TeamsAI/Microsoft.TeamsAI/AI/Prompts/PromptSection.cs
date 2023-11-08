using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;
using System.Text.Json;

namespace Microsoft.Teams.AI.AI.Prompts
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
        public TOutput output { get; set; }

        /// <summary>
        /// The number of tokens that were rendered.
        /// </summary>
        public int length { get; set; }

        /// <summary>
        /// If true the section was truncated because it exceeded the `maxTokens` budget.
        /// </summary>
        public bool tooLong { get; set; }

        /// <summary>
        /// Creates an instance of `RenderedPromptSection`
        /// </summary>
        /// <param name="output"></param>
        /// <param name="length"></param>
        /// <param name="tooLong"></param>
        public RenderedPromptSection(TOutput output, int length = 0, bool tooLong = false)
        {
            this.output = output;
            this.length = length;
            this.tooLong = tooLong;
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
        public readonly int tokens;

        /// <summary>
        /// If true the section is mandatory otherwise it can be safely dropped.
        /// </summary>
        public readonly bool required;

        /// <summary>
        /// Separator to use between sections when rendering as text. Defaults to `\n`.
        /// </summary>
        public readonly string separator;

        /// <summary>
        /// Prefix to use for text output. Defaults to ``.
        /// </summary>
        public readonly string prefix;

        /// <summary>
        /// Creates a new 'PromptSection' instance.
        /// </summary>
        /// <param name="tokens">Sizing strategy for this section. Defaults to auto.</param>
        /// <param name="required">Indicates if this section is required. Defaults to true.</param>
        /// <param name="separator">Separator to use between sections when rendering as text. Defaults to `\n`.</param>
        /// <param name="prefix">Prefix to use for text output. Defaults to ``.</param>
        public PromptSection(int tokens = -1, bool required = true, string separator = "\n", string prefix = "")
        {
            this.tokens = tokens;
            this.required = required;
            this.separator = separator;
            this.prefix = prefix;
        }

        /// <summary>
        /// Render As Messages
        /// </summary>
        /// <param name="context">context</param>
        /// <param name="memory">memory</param>
        /// <param name="functions">functions</param>
        /// <param name="tokenizer">tokenizer</param>
        /// <param name="maxTokens">max tokens</param>
        /// <returns>prompt rendered as a list of messages</returns>
        public abstract Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens);

        /// <summary>
        /// Render As Text
        /// </summary>
        /// <param name="context">context</param>
        /// <param name="memory">memory</param>
        /// <param name="functions">functions</param>
        /// <param name="tokenizer">tokenizer</param>
        /// <param name="maxTokens">max tokens</param>
        /// <returns>prompt rendered as text</returns>
        public virtual async Task<RenderedPromptSection<string>> RenderAsTextAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            RenderedPromptSection<List<ChatMessage>> rendered = await this.RenderAsMessagesAsync(context, memory, functions, tokenizer, maxTokens);

            if (rendered.output.Count == 0)
            {
                return new("");
            }

            string text = string.Join(this.separator, rendered.output.Select(m => this.GetMessageText(m)));
            int prefixLength = tokenizer.Encode(this.prefix).Count;
            int separatorLength = tokenizer.Encode(this.separator).Count;
            int length = prefixLength + rendered.length + ((rendered.output.Count - 1) * separatorLength);

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

        /// <summary>
        /// Truncate Messages
        /// </summary>
        /// <param name="messages">messages to be truncated</param>
        /// <param name="tokenizer">tokenizer</param>
        /// <param name="maxTokens">max tokens</param>
        /// <returns></returns>
        protected RenderedPromptSection<List<ChatMessage>> TruncateMessages(List<ChatMessage> messages, ITokenizer tokenizer, int maxTokens)
        {
            int len = 0;
            List<ChatMessage> output = new();

            foreach (ChatMessage message in messages)
            {
                string text = this.GetMessageText(message);
                List<int> encoded = tokenizer.Encode(text);

                if (len + encoded.Count > maxTokens)
                {
                    int delta = maxTokens - len;
                    string truncated = tokenizer.Decode(encoded.Take(delta).ToList());
                    output.Add(new(message.Role, truncated));
                    len += delta;
                    break;
                }

                len += encoded.Count;
                output.Add(message);
            }

            return new(output, len, len > maxTokens);
        }

        /// <summary>
        /// Parse Text Content Of Message
        /// </summary>
        /// <param name="message">the message to parse</param>
        /// <returns>the parsed message text</returns>
        protected string GetMessageText(ChatMessage message)
        {
            string text = message.Content;

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
