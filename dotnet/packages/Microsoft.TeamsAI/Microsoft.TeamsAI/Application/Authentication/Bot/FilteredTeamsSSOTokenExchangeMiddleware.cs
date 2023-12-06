using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Teams;
using Microsoft.Teams.AI.Exceptions;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Application.Authentication.Bot
{
    internal class FilteredTeamsSSOTokenExchangeMiddleware : TeamsSSOTokenExchangeMiddleware
    {
        private string _oauthConnectionName;

        public FilteredTeamsSSOTokenExchangeMiddleware(IStorage storage, string oauthConnectionName) : base(storage, oauthConnectionName)
        {
            this._oauthConnectionName = oauthConnectionName;
        }

        public new async Task OnTurnAsync(ITurnContext turnContext, NextDelegate next, CancellationToken cancellationToken = default)
        {
            JObject? obj = turnContext.Activity.Value as JObject;
            if (obj == null)
            {
                throw new TeamsAIException("Excepted `turnContext.Activity.Value` to have `connectionName` property");
            };
            string? connectionName = obj.Value<string>("connectionName");

            // If connection name matches then continue to the Teams SSO Token Exchange Middleware.
            if (connectionName == this._oauthConnectionName)
            {
                await base.OnTurnAsync(turnContext, next, cancellationToken);
            }
            else
            {
                await next(cancellationToken);
            }
        }
    }
}
