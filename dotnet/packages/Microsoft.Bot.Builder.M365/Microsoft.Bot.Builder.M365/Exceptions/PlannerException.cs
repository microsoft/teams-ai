using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.Exceptions
{
    public class PlannerException : Exception
    {
        public PlannerException(string message) : base(message)
        {
        }

        public PlannerException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
