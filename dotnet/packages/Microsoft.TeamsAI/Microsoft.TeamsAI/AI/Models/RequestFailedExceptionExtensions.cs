using Azure;
using Microsoft.Teams.AI.Exceptions;
using System.Net;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Provides extension methods for the <see cref="RequestFailedException"/> class.
    /// </summary>
    internal static class RequestFailedExceptionExtensions
    {
        /// <summary>
        /// Converts a <see cref="RequestFailedException"/> to an <see cref="HttpOperationException"/>.
        /// </summary>
        /// <param name="exception">The original <see cref="RequestFailedException"/>.</param>
        /// <returns>An <see cref="HttpOperationException"/> instance.</returns>
        public static HttpOperationException ToHttpOperationException(this RequestFailedException exception)
        {
            string? responseContent = null;

            try
            {
                responseContent = exception.GetRawResponse()?.Content?.ToString();
            }
            catch { }

            return new HttpOperationException(exception.Message, (HttpStatusCode)exception.Status, responseContent);
        }
    }
}
