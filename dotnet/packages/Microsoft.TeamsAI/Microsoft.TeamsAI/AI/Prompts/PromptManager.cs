namespace Microsoft.Teams.AI.AI.Prompts
{
    public class PromptManager
    {
        /// <summary>
        /// Options used to configure the prompt manager.
        /// </summary>
        public class PromptManagerOptions
        {
            /// <summary>
            /// Path to the filesystem folder containing all the applications prompts.
            /// </summary>
            public string PromptFolder { get; set; }
        }
    }
}
