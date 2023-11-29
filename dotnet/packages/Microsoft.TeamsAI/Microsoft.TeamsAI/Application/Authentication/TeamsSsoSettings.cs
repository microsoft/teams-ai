using Microsoft.Identity.Client;

namespace Microsoft.Teams.AI.Application.Authentication
{
    public class TeamsSsoSettings
    {
        public string[] Scopes { get; set; }

        public IConfidentialClientApplication MSAL { get; set; }

        public string SignInLink { get; set; }

        public int Timeout { get; set; }

        public bool EndOnInvalidMessage { get; set; }

        public TeamsSsoSettings(string[] scopes, string signInLink, IConfidentialClientApplication msal, int timeout = 900000, bool endOnInvalidMessage = true)
        {
            this.Scopes = scopes;
            this.MSAL = msal;
            this.SignInLink = signInLink;
            this.Timeout = timeout;
            this.EndOnInvalidMessage = endOnInvalidMessage;
        }
    }
}
