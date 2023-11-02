using System.Net;

namespace Microsoft.Teams.AI.Exceptions
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
        /// <param name="innerException">The inner exception. Default is null.</param>
        public InvokeResponseException(HttpStatusCode statusCode, object? body = null, Exception? innerException = null) : base("InvokeResponseException", innerException)
        {
            StatusCode = statusCode;
            Body = body;
        }
    }
}
