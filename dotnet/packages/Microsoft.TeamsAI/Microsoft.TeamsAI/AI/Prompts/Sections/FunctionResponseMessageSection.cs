﻿using Microsoft.Teams.AI.AI.Models;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// Message containing the response to a function call.
    /// </summary>
    public class FunctionResponseMessageSection : PromptSection
    {
        /// <summary>
        /// Name of the function that was called.
        /// </summary>
        public readonly string Name;

        /// <summary>
        /// The response returned by the called function.
        /// </summary>
        public readonly dynamic Response;

        private string _text = "";
        private int _length = -1;

        /// <summary>
        /// Creates instance of `FunctionResponseMessageSection`
        /// </summary>
        /// <param name="name">Name of the function that was called.</param>
        /// <param name="response">The response returned by the called function.</param>
        /// <param name="tokens">Sizing strategy for this section. Defaults to `auto`.</param>
        /// <param name="prefix">Prefix to use for function messages when rendering as text. Defaults to `user: ` to simulate the response coming from the user.</param>
        public FunctionResponseMessageSection(string name, dynamic response, int tokens = -1, string prefix = "user: ") : base(tokens, true, "\n", prefix)
        {
            this.Name = name;
            this.Response = response;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            // calculate and cache length
            if (this._length < 0)
            {
                this._text = Convert.ToString(this.Response);
                this._length = tokenizer.Encode(this.Name).Count + tokenizer.Encode(this._text).Count;
            }

            ChatMessage message = new(ChatRole.Function) { Content = this._text };
            message.Name = this.Name;

            return await Task.FromResult(this.TruncateMessages(new() { message }, tokenizer, maxTokens));
        }
    }
}
