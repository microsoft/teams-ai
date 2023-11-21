
using System.Runtime.CompilerServices;

namespace Microsoft.Teams.AI.Utilities
{
    /// <summary>
    /// Utility class for verifying arguments and local variables.
    /// </summary>
    internal class Verify
    {
        /// <summary>
        /// Verifies that the argument is not null.
        /// </summary>
        /// <param name="argument">An arbitrary object.</param>
        /// <param name="parameterName">Optional. The name of the parameter. If not populated, it defaults to the name of the variable passed to the <paramref name="argument"/> parameter.</param>
        /// <exception cref="ArgumentNullException"></exception>
        public static void ParamNotNull(object? argument, [CallerArgumentExpression("argument")] string? parameterName = default)
        {
            if (argument == null)
            {
                throw new ArgumentNullException(parameterName);
            }
        }

        /// <summary>
        /// Verifies that the local variable is not null.
        /// </summary>
        /// <param name="variable">An arbitrary object.</param>
        /// <exception cref="ArgumentNullException"></exception>
        public static void NotNull(object? variable)
        {
            if (variable == null)
            {
                throw new ArgumentNullException(nameof(variable));
            }
        }
    }
}
