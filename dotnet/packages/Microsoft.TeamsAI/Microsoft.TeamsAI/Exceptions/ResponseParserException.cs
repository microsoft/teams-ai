using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.TeamsAI.Exceptions
{
    public class ResponseParserException : Exception
    {
        public ResponseParserException(string message) : base(message)
        {
        }
    }
}
