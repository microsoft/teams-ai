using Microsoft.Identity.Client;
using Microsoft.Identity.Client.Extensibility;

namespace Microsoft.Teams.AI
{
    internal class ConfidentialClientApplicationAdapter : IConfidentialClientApplicationAdapter
    {
        private readonly IConfidentialClientApplication _msal;

        public ConfidentialClientApplicationAdapter(IConfidentialClientApplication msal)
        {
            _msal = msal;
        }

        public IAppConfig AppConfig
        {
            get
            {
                return _msal.AppConfig;
            }
        }

        public Task<AuthenticationResult> InitiateLongRunningProcessInWebApi(IEnumerable<string> scopes, string userToken, ref string longRunningProcessSessionKey)
        {
            return ((ILongRunningWebApi)_msal).InitiateLongRunningProcessInWebApi(
                                scopes,
                                userToken,
                                ref longRunningProcessSessionKey
                            ).ExecuteAsync();
        }

        public async Task<bool> StopLongRunningProcessInWebApiAsync(string longRunningProcessSessionKey, CancellationToken cancellationToken = default)
        {
            ILongRunningWebApi? oboCca = _msal as ILongRunningWebApi;
            if (oboCca != null)
            {
                return await oboCca.StopLongRunningProcessInWebApiAsync(longRunningProcessSessionKey, cancellationToken);
            }
            return false;
        }

        public async Task<AuthenticationResult> AcquireTokenInLongRunningProcess(IEnumerable<string> scopes, string longRunningProcessSessionKey)
        {
            return await ((ILongRunningWebApi)_msal).AcquireTokenInLongRunningProcess(
                        scopes,
                        longRunningProcessSessionKey
                    ).ExecuteAsync();
        }
    }
}
