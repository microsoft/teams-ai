using Azure;
using Microsoft.Teams.AI.Exceptions;
using System.Net;
using System.ClientModel;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Provides extension methods for the <see cref="ClientResultException"/> class.
    /// </summary>
    internal static class ClientResultExceptionExtensions
    {
        /// <summary>
        /// Converts a <see cref="ClientResultException"/> to an <see cref="ClientResultException"/>.
        /// </summary>
        /// <param name="exception">The original <see cref="RequestFailedException"/>.</param>
        /// <returns>An <see cref="HttpOperationException"/> instance.</returns>
        public static HttpOperationException ToHttpOperationException(this ClientResultException exception)
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
