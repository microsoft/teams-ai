using Microsoft.Identity.Client;

namespace Microsoft.Teams.AI
{
    internal interface IConfidentialClientApplicationAdapter
    {
        IAppConfig AppConfig { get; }

        Task<AuthenticationResult> InitiateLongRunningProcessInWebApi(IEnumerable<string> scopes, string userToken, ref string longRunningProcessSessionKey);

        Task<bool> StopLongRunningProcessInWebApiAsync(string longRunningProcessSessionKey, CancellationToken cancellationToken = default);

        Task<AuthenticationResult> AcquireTokenInLongRunningProcess(IEnumerable<string> scopes, string longRunningProcessSessionKey);
    }
}
