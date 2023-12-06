using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    public class MockedAuthentication<TState> : IAuthentication<TState>
        where TState : TurnState, new()
    {
        private string _mockedToken;
        private SignInStatus _mockedStatus;

        public MockedAuthentication(SignInStatus mockedStatus = SignInStatus.Complete, string mockedToken = "mocked token")
        {
            _mockedToken = mockedToken;
            _mockedStatus = mockedStatus;
        }

        public void Initialize(Application<TState> app, string name, IStorage? storage = null)
        {
            return;
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
            if (_mockedStatus == SignInStatus.Complete)
            {
                return Task.FromResult(_mockedToken)!;
            }

            return Task.FromResult<string?>(null)!;
        }

        public Task SignOutUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }
}
