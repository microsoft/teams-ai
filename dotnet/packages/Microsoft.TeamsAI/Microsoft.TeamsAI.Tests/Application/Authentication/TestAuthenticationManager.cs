using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    internal sealed class TestAuthenticationManager : AuthenticationManager<TurnState>
    {
        public TestAuthenticationManager(AuthenticationOptions<TurnState> options, Application<TurnState> app, IStorage? storage = null) : base(app, options, storage)
        {
            foreach (string key in options._authenticationSettings.Keys)
            {
                object setting = options._authenticationSettings[key];
                if (setting is TestAuthenticationSettings mockSettings)
                {
                    _authentications.Add(key, new MockedAuthentication<TurnState>(mockSettings));
                }
            }
        }
    }
}
