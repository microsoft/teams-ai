using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;

namespace Microsoft.Teams.AI.Application.Authentication.MessageExtensions
{
    /// <summary>
    /// Handles authentication for Message Extensions in Teams using OAuth Connection.
    /// </summary>
    public class OAuthMessageExtensionsAuthentication : MessageExtensionsAuthenticationBase
    {
        /// <summary>
        /// Gets the sign in link for the user.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The sign in link</returns>
        public override Task<string> GetSignInLink(ITurnContext context)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Handles the user sign in.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="magicCode">The magic code from user sign-in.</param>
        /// <returns>The token response if successfully verified the magic code</returns>
        public override Task<TokenResponse> HandlerUserSignIn(ITurnContext context, string magicCode)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Handles the SSO token exchange.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The token response if token exchange success</returns>
        public override Task<TokenResponse> HandleSsoTokenExchange(ITurnContext context)
        {
            throw new NotImplementedException();
        }
    }
}
