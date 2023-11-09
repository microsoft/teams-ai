using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;
using System.Text.Json;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// An `assistant` message containing a function to call.
    ///
    /// The function call information is returned by the model so we use an "assistant" message to
    /// represent it in conversation history.
    /// </summary>
    public class FunctionCallMessageSection : PromptSection
    {
        /// <summary>
        /// Chat Function Call
        /// </summary>
        public readonly FunctionCall FunctionCall;

        private int _length = -1;

        /// <summary>
        /// Creates instance of `FunctionCallMessageSection`
        /// </summary>
        /// <param name="functionCall">name and arguments of the function to call.</param>
        /// <param name="tokens">Sizing strategy for this section. Defaults to `auto`.</param>
        /// <param name="prefix">Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.</param>
        public FunctionCallMessageSection(FunctionCall functionCall, int tokens = -1, string prefix = "assistant: ") : base(tokens, true, "\n", prefix)
        {
            this.FunctionCall = functionCall;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            // calculate and cache length
            if (this._length < 0)
            {
                string text = JsonSerializer.Serialize(this.FunctionCall);
                this._length = tokenizer.Encode(text).Count;
            }

            List<ChatMessage> messages = new();

            if (this._length > 0)
            {
                ChatMessage message = new(ChatRole.Assistant, "");
                message.FunctionCall = this.FunctionCall;
                messages.Add(message);
            }

            return await Task.FromResult(this.TruncateMessages(messages, tokenizer, maxTokens));
        }
    }
}
