﻿using Microsoft.Teams.AI.AI.Models;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// A section of text that will be rendered as a message.
    /// </summary>
    public class TextSection : PromptSection
    {
        /// <summary>
        /// Chat Message Content
        /// </summary>
        public readonly string text;

        /// <summary>
        /// Chat Message Role
        /// </summary>
        public readonly ChatRole role;

        private int _length = -1;

        /// <summary>
        /// Creates instance of `TextSection`
        /// </summary>
        /// <param name="text">message text</param>
        /// <param name="role">message role</param>
        /// <param name="tokens">tokens</param>
        /// <param name="required">required</param>
        /// <param name="separator">separator</param>
        /// <param name="prefix">prefix</param>
        public TextSection(string text, ChatRole role, int tokens = -1, bool required = false, string separator = "\n", string prefix = "") : base(tokens, required, separator, prefix)
        {
            this.text = text;
            this.role = role;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            // calculate and cache length
            if (this._length < 0)
            {
                this._length = tokenizer.Encode(this.text).Count;
            }

            List<ChatMessage> messages = new();

            if (this._length > 0)
            {
                messages.Add(new(this.role) { Content = this.text });
            }

            return await Task.FromResult(this.TruncateMessages(messages, tokenizer, maxTokens));
        }
    }
}
