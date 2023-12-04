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
    }
}
