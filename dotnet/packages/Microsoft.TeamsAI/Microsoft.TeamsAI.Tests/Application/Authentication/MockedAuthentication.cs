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
        private bool _validActivity;

        public MockedAuthentication(SignInStatus mockedStatus = SignInStatus.Complete, string mockedToken = "mocked token", bool validActivity = true)
        {
            _mockedToken = mockedToken;
            _mockedStatus = mockedStatus;
            _validActivity = validActivity;
        }

        public void Initialize(Application<TState> app, string name, IStorage? storage = null)
        {
            return;
        }

        public Task<string?> IsUserSignedInAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<string?>(null);
        }

        public Task<bool> IsValidActivityAsync(ITurnContext context)
        {
            return Task.FromResult(_validActivity);
        }

        public IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, AuthException, Task> handler)
        {
            return this;
        }

        public IAuthentication<TState> OnUserSignInSuccess(Func<ITurnContext, TState, Task> handler)
        {
            return this;
        }

        public Task<SignInResponse> SignInUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            var result = new SignInResponse(_mockedStatus);
            if (_mockedStatus == SignInStatus.Complete)
            {
                result.Token = _mockedToken;
            }
            return Task.FromResult(result);
        }

        public Task SignOutUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }
}
