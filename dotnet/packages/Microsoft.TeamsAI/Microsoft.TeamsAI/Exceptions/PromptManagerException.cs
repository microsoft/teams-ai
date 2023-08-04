using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.TeamsAI.Exceptions
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
