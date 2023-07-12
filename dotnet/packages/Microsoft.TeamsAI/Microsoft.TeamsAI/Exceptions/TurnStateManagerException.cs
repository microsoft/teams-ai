namespace Microsoft.TeamsAI.Exceptions
{
    internal class TurnStateManagerException : Exception
    {
        public TurnStateManagerException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
