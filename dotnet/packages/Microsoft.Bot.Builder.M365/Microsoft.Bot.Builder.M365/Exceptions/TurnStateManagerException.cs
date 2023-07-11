namespace Microsoft.Bot.Builder.M365.Exceptions
{
    internal class TurnStateManagerException : Exception
    {
        public TurnStateManagerException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
