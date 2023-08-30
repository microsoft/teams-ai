using System.Net;

namespace Microsoft.TeamsAI.Exceptions
{
    /// <summary>
    /// Exception thrown when an HTTP operation fails.
    /// </summary>
    public class HttpOperationException : Exception
    {
        /// <summary>
        /// HTTP status code.
        /// </summary>
        public readonly HttpStatusCode? StatusCode;

        /// <summary>
        /// HTTP response content.
        /// </summary>
        public readonly string? ResponseContent;

        /// <summary>
        /// Create an instance of the HttpOperationException class.
        /// </summary>
        /// <param name="message">The exception message.</param>
        /// <param name="httpStatusCode">The HTTP status code.</param>
        /// <param name="responseContent">The HTTP response content.</param>
        public HttpOperationException(string message, HttpStatusCode? httpStatusCode = null, string? responseContent = null) : base(message)
        {
            StatusCode = httpStatusCode;
            ResponseContent = responseContent;
        }
    }
}
