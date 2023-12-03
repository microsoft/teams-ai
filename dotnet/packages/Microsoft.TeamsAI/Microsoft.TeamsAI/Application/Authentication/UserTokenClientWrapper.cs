using Microsoft.Bot.Builder;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI
{
    internal class UserTokenClientWrapper
    {
        public static async Task<SignInResource> GetSignInResourceAsync(ITurnContext context, string connectionName, CancellationToken cancellationToken = default)
        {
            UserTokenClient userTokenClient = GetUserTokenClient(context);
            return await userTokenClient.GetSignInResourceAsync(connectionName, context.Activity, "", cancellationToken);
        }

        public static async Task<TokenResponse> GetUserTokenAsync(ITurnContext context, string connectionName, string magicCode, CancellationToken cancellationToken = default)
        {
            UserTokenClient userTokenClient = GetUserTokenClient(context);
            return await userTokenClient.GetUserTokenAsync(context.Activity.From.Id, connectionName, context.Activity.ChannelId, magicCode, cancellationToken);
        }

        public static async Task<TokenResponse> ExchangeTokenAsync(ITurnContext context, string connectionName, TokenExchangeRequest tokenExchangeRequest, CancellationToken cancellationToken = default)
        {
            UserTokenClient userTokenClient = GetUserTokenClient(context);
            return await userTokenClient.ExchangeTokenAsync(context.Activity.From.Id, connectionName, context.Activity.ChannelId, tokenExchangeRequest, cancellationToken);
        }

        public static async Task SignoutUserAsync(ITurnContext context, string connectionName, CancellationToken cancellationToken = default)
        {
            UserTokenClient userTokenClient = GetUserTokenClient(context);
            await userTokenClient.SignOutUserAsync(context.Activity.From.Id, connectionName, context.Activity.ChannelId, cancellationToken);
        }

        private static UserTokenClient GetUserTokenClient(ITurnContext context)
        {
            UserTokenClient userTokenClient = context.TurnState.Get<UserTokenClient>();
            if (userTokenClient == null)
            {
                throw new TeamsAIException("OAuth Connection is not supported by the current adapter");
            }
            return userTokenClient;
        }
    }
}
