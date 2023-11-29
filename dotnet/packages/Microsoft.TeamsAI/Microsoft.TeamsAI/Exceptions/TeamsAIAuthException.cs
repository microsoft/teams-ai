namespace Microsoft.Teams.AI.Exceptions
{
    /// <summary>
    /// Cause of an authentication exception.
    /// </summary>
    public enum TeamsAIAuthExceptionReason
    {
        /// <summary>
        /// The authentication flow completed without a token.
        /// </summary>
        CompletionWithoutToken,
        /// <summary>
        /// Other error.
        /// </summary>
        Other
    }

    /// <summary>
    /// An exception thrown when an authentication error occurs.
    /// </summary>
    public class TeamsAIAuthException : Exception
    {
        /// <summary>
        /// The cause of the exception.
        /// </summary>
        public TeamsAIAuthExceptionReason Cause { get; }

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="message">The exception message</param>
        /// <param name="reason">The cause of the exception</param>
        public TeamsAIAuthException(string message, TeamsAIAuthExceptionReason reason = TeamsAIAuthExceptionReason.Other) : base(message)
        {
            Cause = reason;
        }
    }
}
