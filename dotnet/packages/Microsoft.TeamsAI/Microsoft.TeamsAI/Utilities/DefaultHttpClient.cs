using System.Runtime.CompilerServices;

namespace Microsoft.Teams.AI.Utilities
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
