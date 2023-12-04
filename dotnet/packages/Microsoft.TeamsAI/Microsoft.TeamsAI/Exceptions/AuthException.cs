namespace Microsoft.Teams.AI.Exceptions
{
    /// <summary>
    /// Cause of user authentication exception.
    /// </summary>
    public enum AuthExceptionReason
    {
        /// <summary>
        /// The authentication flow completed without a token.
        /// </summary>
        CompletionWithoutToken,

        /// <summary>
        /// The incoming activity is not valid for sign in flow.
        /// </summary>
        InvalidActivity,

        /// <summary>
        /// Other error.
        /// </summary>
        Other
    }

    /// <summary>
    /// An exception thrown when user authentication error occurs.
    /// </summary>
    public class AuthException : Exception
    {
        /// <summary>
        /// The cause of the exception.
        /// </summary>
        public AuthExceptionReason Cause { get; }

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="message">The exception message</param>
        /// <param name="reason">The cause of the exception</param>
        public AuthException(string message, AuthExceptionReason reason = AuthExceptionReason.Other) : base(message)
        {
            Cause = reason;
        }
    }
}
