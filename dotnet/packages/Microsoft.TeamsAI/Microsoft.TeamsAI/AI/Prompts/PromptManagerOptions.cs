using Microsoft.Teams.AI.AI.Models;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// Options used to configure the prompt manager.
    /// </summary>
    public class PromptManagerOptions
    {
        /// <summary>
        /// Path to the filesystem folder containing all the applications prompts.
        /// </summary>
        public string PromptFolder { get; set; } = string.Empty;

        /// <summary>
        /// Message role to use for loaded prompts.
        ///
        /// Default: ChatRole.System
        /// </summary>
        public ChatRole Role { get; set; } = ChatRole.System;

        /// <summary>
        /// Maximum number of tokens to of conversation history to include in prompts.
        ///
        /// The default is to let conversation history consume the remainder of the prompts
        /// `max_input_tokens` budget. Setting this a value greater then 1 will override that and
        /// all prompts will use a fixed token budget.
        ///
        /// Default: 1
        /// </summary>
        public int MaxConversationHistoryTokens { get; set; } = 1;

        /// <summary>
        /// Maximum number of messages to use when rendering conversation_history.
        ///
        /// This controls the automatic pruning of the conversation history that's done by the planners
        /// LLMClient instance. This helps keep your memory from getting too big.
        ///
        /// Default: 10
        /// </summary>
        public int MaxHistoryMessages { get; set; } = 10;

        /// <summary>
        /// Maximum number of tokens user input to include in prompts.
        ///
        /// This defaults to unlimited but can set to a value greater then `1` to limit the length of
        /// user input included in prompts. For example, if set to `100` then the any user input over
        /// 100 tokens in length will be truncated.
        /// </summary>
        public int MaxInputTokens { get; set; } = -1;
    }
}
