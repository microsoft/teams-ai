using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    public class MockedAuthentication<TState> : IAuthentication<TState>
        where TState : TurnState, new()
    {
        private string? _mockedToken;

        public MockedAuthentication(TestAuthenticationSettings settings)
        {
            if (settings != null)
            {
                _mockedToken = settings.MockedToken;
            }
        }


        public Task<string?> IsUserSignedInAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<string?>(null);
        }

        public IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, AuthException, Task> handler)
        {
            return this;
        }

        public IAuthentication<TState> OnUserSignInSuccess(Func<ITurnContext, TState, Task> handler)
        {
            return this;
        }

        public Task<string?> SignInUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_mockedToken);
        }

        public Task SignOutUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }

    public class TestAuthenticationSettings
    {
        public string? MockedToken;

        public TestAuthenticationSettings(string? token = null)
        {
            MockedToken = token;
        }
    }
}
