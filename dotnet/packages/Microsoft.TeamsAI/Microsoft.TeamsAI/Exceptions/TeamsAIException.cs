
namespace Microsoft.Teams.AI.Exceptions
{
    /// <summary>
    /// Base exception for the TeamsAI library.
    /// </summary>
    public class TeamsAIException : Exception
    {
        /// <summary>
        /// Create an instance of the <see cref="TeamsAIException"/> class.
        /// </summary>
        /// <param name="message">Exception message.</param>
        public TeamsAIException(string message) : base(message)
        {
        }

        /// <summary>
        /// Create an instance of the <see cref="TeamsAIException"/> class.
        /// </summary>
        /// <param name="message">Exception message.</param>
        /// <param name="innerException">Inner exception.</param>
        public TeamsAIException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
