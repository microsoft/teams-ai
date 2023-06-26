using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.Exceptions
{
    public class PromptManagerException : Exception
    {
        public PromptManagerException(string message) : base(message)
        {
        }

        public PromptManagerException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
