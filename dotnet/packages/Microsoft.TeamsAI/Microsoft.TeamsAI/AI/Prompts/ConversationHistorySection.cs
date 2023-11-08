using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// A section that renders the conversation history.
    /// </summary>
    public class ConversationHistorySection : PromptSection
    {
        /// <summary>
        /// Name of memory variable used to store the histories.
        /// </summary>
        public readonly string variable;

        /// <summary>
        /// Prefix to use for user messages when rendering as text. Defaults to `user: `.
        /// </summary>
        public readonly string userPrefix;

        /// <summary>
        /// Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
        /// </summary>
        public readonly string assistantPrefix;

        /// <summary>
        /// Creates a new 'ConversationHistorySection' instance.
        /// </summary>
        /// <param name="variable">Name of memory variable used to store the histories.</param>
        /// <param name="tokens">Sizing strategy for this section. Defaults to `proportional` with a value of `1.0`.</param>
        /// <param name="required">Indicates if this section is required. Defaults to `false`.</param>
        /// <param name="userPrefix">Prefix to use for user messages when rendering as text. Defaults to `user: `.</param>
        /// <param name="assistantPrefix">Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.</param>
        /// <param name="separator">Separator to use between sections when rendering as text. Defaults to `\n`.</param>
        public ConversationHistorySection(string variable, int tokens = 1, bool required = false, string userPrefix = "user: ", string assistantPrefix = "assistant: ", string separator = "\n") : base(tokens, required, separator)
        {
            this.variable = variable;
            this.userPrefix = userPrefix;
            this.assistantPrefix = assistantPrefix;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<string>> RenderAsTextAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            List<ChatMessage>? messages = memory.GetValue<List<ChatMessage>>(this.variable);

            if (messages == null)
            {
                return new("", 0, false);
            }

            messages.Reverse();

            // Populate history and stay under the token budget

            int tokens = 0;
            int budget = this.tokens > 1 ? Math.Min(this.tokens, maxTokens) : maxTokens;
            int separatorLength = tokenizer.Encode(this.separator).Count;
            List<string> lines = new();

            foreach (ChatMessage message in messages)
            {
                string prefix = message.Role == ChatRole.User ? userPrefix : message.Role == ChatRole.Assistant ? assistantPrefix : "";
                string line = prefix + message.Content;
                int length = tokenizer.Encode(line).Count;

                if (lines.Count > 0)
                {
                    length += separatorLength;
                }

                // Stop if we're over the token budget
                if (tokens + length > budget)
                {
                    break;
                }

                tokens += length;
                lines.Add(line);
            }

            string text = string.Join(this.separator, lines);
            return await Task.FromResult(new RenderedPromptSection<string>(text, tokens, tokens > budget));
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            List<ChatMessage>? messages = memory.GetValue<List<ChatMessage>>(this.variable);

            if (messages == null)
            {
                return new(new() { }, 0, false);
            }

            messages.Reverse();

            // Populate history and stay under the token budget

            int tokens = 0;
            int budget = this.tokens > 1 ? Math.Min(this.tokens, maxTokens) : maxTokens;
            List<ChatMessage> output = new();

            foreach (ChatMessage message in messages)
            {
                int length = tokenizer.Encode(this.GetMessageText(message)).Count;

                // Stop if we're over the token budget
                if (tokens + length > budget)
                {
                    break;
                }

                tokens += length;
                output.Add(message);
            }

            return await Task.FromResult(new RenderedPromptSection<List<ChatMessage>>(output, tokens, tokens > budget));
        }
    }
}
