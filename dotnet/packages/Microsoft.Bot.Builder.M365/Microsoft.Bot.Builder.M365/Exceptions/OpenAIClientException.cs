using System.Net;
using System.Runtime.Serialization;

namespace Microsoft.Bot.Builder.M365.Exceptions
{
    public class OpenAIClientException : Exception
    {
        public readonly HttpStatusCode? statusCode;

        public OpenAIClientException()
        {
        }

        public OpenAIClientException(string message, HttpStatusCode? httpStatusCode = null) : base(message)
        {
            statusCode = httpStatusCode;
        }

        public OpenAIClientException(string message, Exception innerException, HttpStatusCode? httpStatusCode = null) : base(message, innerException)
        {
            statusCode = httpStatusCode;
        }
    }
}