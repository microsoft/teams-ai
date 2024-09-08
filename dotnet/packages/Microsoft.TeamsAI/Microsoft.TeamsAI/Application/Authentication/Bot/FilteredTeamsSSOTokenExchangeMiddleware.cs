using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Teams;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Application.Authentication.Bot
{
    internal class FilteredTeamsSSOTokenExchangeMiddleware : IMiddleware
    {
        private string _oauthConnectionName;
        private TeamsSSOTokenExchangeMiddleware tokenExchangeMiddleware;

        public FilteredTeamsSSOTokenExchangeMiddleware(IStorage storage, string oauthConnectionName)
        {
            this.tokenExchangeMiddleware = new TeamsSSOTokenExchangeMiddleware(storage, oauthConnectionName);
            this._oauthConnectionName = oauthConnectionName;
        }

        public async Task OnTurnAsync(ITurnContext turnContext, NextDelegate next, CancellationToken cancellationToken = default)
        {
            if (string.Equals(Channels.Msteams, turnContext.Activity.ChannelId, StringComparison.OrdinalIgnoreCase)
                && string.Equals(SignInConstants.TokenExchangeOperationName, turnContext.Activity.Name, StringComparison.OrdinalIgnoreCase))
            {
                string? connectionName = _GetConnectionName(turnContext);

                // If connection name matches then continue to the Teams SSO Token Exchange Middleware.
                if (connectionName == this._oauthConnectionName)
                {
                    await tokenExchangeMiddleware.OnTurnAsync(turnContext, next, cancellationToken).ConfigureAwait(false);
                    return;
                }
            }

            await next(cancellationToken).ConfigureAwait(false);
        }

        private string? _GetConnectionName(ITurnContext turnContext)
        {
            JObject? obj = turnContext.Activity.Value as JObject;
            if (obj == null)
            {
                throw new TeamsAIException("Excepted `turnContext.Activity.Value` to have `connectionName` property");
            };
            return obj.Value<string>("connectionName");
        }
    }
}
