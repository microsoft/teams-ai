
using System.Runtime.CompilerServices;

namespace Microsoft.TeamsAI.Utilities
{
    public class Verify
    {
        public static void ParamNotNull(object? argument, [CallerArgumentExpression("argument")] string? parameterName = default)
        {
            if (argument == null)
            {
                throw new ArgumentNullException(parameterName);
            }
        }
    }
}
