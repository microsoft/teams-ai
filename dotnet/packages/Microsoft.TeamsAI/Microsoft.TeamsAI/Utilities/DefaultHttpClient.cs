using System.Runtime.CompilerServices;

// For Unit Test
[assembly: InternalsVisibleTo("Microsoft.TeamsAI.Tests")]
namespace Microsoft.TeamsAI.Utilities
{
    /// <summary>
    /// Provide a default HttpClient to be shared across the library.
    /// </summary>
    internal static class DefaultHttpClient
    {
        static DefaultHttpClient()
        {
            Instance = new HttpClient();
        }

        public static HttpClient Instance { get; internal set; }
    }
}
