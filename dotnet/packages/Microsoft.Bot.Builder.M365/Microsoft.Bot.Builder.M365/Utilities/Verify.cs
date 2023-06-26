
namespace Microsoft.Bot.Builder.M365.Utilities
{
    public class Verify
    {
        public static void NotNull(object? argument, string? parameterName = default)
        {
            if (argument == null)
            {
                throw new ArgumentNullException(parameterName);
            }
        }
    }
}
