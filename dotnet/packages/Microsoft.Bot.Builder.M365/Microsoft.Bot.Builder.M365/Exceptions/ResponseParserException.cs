using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.Exceptions
{
    public class ResponseParserException : Exception
    {
        public ResponseParserException(string message) : base(message)
        {
        }
    }
}
