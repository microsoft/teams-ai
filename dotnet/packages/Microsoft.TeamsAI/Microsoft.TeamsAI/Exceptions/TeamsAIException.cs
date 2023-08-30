
namespace Microsoft.TeamsAI.Exceptions
{
    public class TeamsAIException : Exception
    {
        public TeamsAIException(string message) : base(message)
        {
        }

        public TeamsAIException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
