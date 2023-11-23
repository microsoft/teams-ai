using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// The user authentication manager
    /// </summary>
    /// <typeparam name="TState">Type of the turn state</typeparam>
    public class AuthenticationManager<TState>
        where TState : TurnState, new()
    {
        private Dictionary<string, IAuthentication> _authentications { get; }
        private string _default { get; set; }

        /// <summary>
        /// Creates a new instance of the class
        /// </summary>
        /// <param name="options">The authentication options</param>
        /// <exception cref="TeamsAIException">Throws when the options does not contain authentication handlers</exception>
        public AuthenticationManager(AuthenticationOptions options)
        {
            if (options.Authentications.Count == 0)
            {
                throw new TeamsAIException("Authentications setting is empty");
            }

            // If developer does not specify default authentication, set default to the first one in the options
            _default = options.Default ?? options.Authentications.First().Key;

            _authentications = options.Authentications;
        }

        /// <summary>
        /// Sign in a user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="handlerName">Optional. The name of the authentication handler to use. If not specified, the default handler name is used.</param>
        /// <returns>The sign in response</returns>
        public async Task<SignInResponse> SignUserIn(ITurnContext context, TState state, string? handlerName = null)
        {
            if (handlerName == null)
            {
                handlerName = _default;
            }

            IAuthentication auth = Get(handlerName);
            SignInResponse response = await auth.SignInUser(context, state);
            if (response.Status == SignInStatus.Complete)
            {
                SetTokenInState(state, handlerName, response.Token!);
            }
            return response;
        }

        /// <summary>
        /// Signs out a user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="handlerName">Optional. The name of the authentication handler to use. If not specified, the default handler name is used.</param>
        public async Task SignOutUser(ITurnContext context, TState state, string? handlerName = null)
        {
            if (handlerName == null)
            {
                handlerName = _default;
            }

            IAuthentication auth = Get(handlerName);
            await auth.SignOutUser(context, state);
            DeleteTokenFromState(state, handlerName);
        }

        /// <summary>
        /// Check whether current activity supports authentication.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <param name="handlerName">Optional. The name of the authentication handler to use. If not specified, the default handler name is used.</param>
        /// <returns>True if current activity supports authentication. Otherwise, false.</returns>
        public async Task<bool> IsValidActivity(ITurnContext context, string? handlerName = null)
        {
            if (handlerName == null)
            {
                handlerName = _default;
            }

            IAuthentication auth = Get(handlerName);
            return await auth.IsValidActivity(context);
        }

        private IAuthentication Get(string name)
        {
            if (_authentications.ContainsKey(name))
            {
                return _authentications[name];
            }

            throw new TeamsAIException($"Could not find authentication handler with name '{name}'.");
        }

        private void SetTokenInState(TState state, string handlerName, string token)
        {
            state.Temp.AuthTokens[handlerName] = token;
        }

        private void DeleteTokenFromState(TState state, string handlerName)
        {
            if (state.Temp.AuthTokens.ContainsKey(handlerName))
            {
                state.Temp.AuthTokens.Remove(handlerName);
            }
        }
    }
}
