namespace Microsoft.Teams.AI.Application
{
    /// <summary>
    /// The type of streaming message being sent.
    /// </summary>
    public enum StreamType
    {
        /// <summary>
        /// An informative update.
        /// </summary>
        Informative,

        /// <summary>
        /// A chunk of partial message text.
        /// </summary>
        Streaming,

        /// <summary>
        /// The final message.
        /// </summary>
        Final
    }
}
