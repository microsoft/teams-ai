using System.Net;

namespace Microsoft.TeamsAI.Exceptions
{
    /// <summary>
    /// A custom exception for invoke response errors.
    /// </summary>
    internal class InvokeResponseException : Exception
    {

        /// <summary>
        /// A getter for the <see cref="InvokeResponseException"/> status code
        /// </summary>
        public HttpStatusCode StatusCode { get; }

        /// <summary>
        /// A getter for the <see cref="InvokeResponseException"/> body
        /// </summary>
        public object? Body { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="InvokeResponseException"/> class.
        /// </summary>
        /// <param name="statusCode">The Http status code of the error.</param>
        /// <param name="body">The body of the exception. Default is null.</param>
        public InvokeResponseException(HttpStatusCode statusCode, object? body = null, Exception? innerException = null) : base("InvokeResponseException", innerException)
        {
            StatusCode = statusCode;
            Body = body;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="InvokeResponseException"/> class.
        /// </summary>
        public InvokeResponseException()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="InvokeResponseException"/> class.
        /// </summary>
        /// <param name="message">The message that explains the reason for the exception, or an empty string.</param>
        public InvokeResponseException(string message)
            : base(message)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="InvokeResponseException"/> class.
        /// </summary>
        /// <param name="message">The message that explains the reason for the exception, or an empty string.</param>
        /// <param name="innerException">Gets the System.Exception instance that caused the current exception.</param>
        public InvokeResponseException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
