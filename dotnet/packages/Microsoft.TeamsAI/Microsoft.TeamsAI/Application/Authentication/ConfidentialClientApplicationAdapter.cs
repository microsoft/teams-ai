using Microsoft.Identity.Client;

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
    }

}
