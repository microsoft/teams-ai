using Microsoft.Bot.Builder.Dialogs;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// The settings for OAuthAuthentication.
    /// </summary>
    public class OAuthSettings : OAuthPromptSettings
    {
        /// <summary>
        /// The token exchange uri for SSO in adaptive card auth scenario.
        /// </summary>
        public string? TokenExchangeUri { get; set; }

        /// <summary>
        /// Set to `true` to enable SSO when authenticating using Azure Active Directory (AAD).
        /// </summary>
        public bool? EnableSso { get; set; }
    }
}
