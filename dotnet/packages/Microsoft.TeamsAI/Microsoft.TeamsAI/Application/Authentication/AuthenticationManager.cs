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
        private Dictionary<string, IAuthentication<TState>> _authentications { get; }

        /// <summary>
        /// The default authentication setting name.
        /// </summary>
        public string Default { get; }

        /// <summary>
        /// Creates a new instance of the class
        /// </summary>
        /// <param name="options">The authentication options</param>
        /// <exception cref="TeamsAIException">Throws when the options does not contain authentication handlers</exception>
        public AuthenticationManager(AuthenticationOptions<TState> options)
        {
            if (options.Authentications.Count == 0)
            {
                throw new TeamsAIException("Authentications setting is empty");
            }

            // If developer does not specify default authentication, set default to the first one in the options
            Default = options.Default ?? options.Authentications.First().Key;

            _authentications = options.Authentications;
        }

        /// <summary>
        /// Sign in a user.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="settingName">Optional. The name of the authentication handler to use. If not specified, the default handler name is used.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The sign in response</returns>
        public async Task<SignInResponse> SignUserInAsync(ITurnContext context, TState state, string? settingName = null, CancellationToken cancellationToken = default)
        {
            if (settingName == null)
            {
                settingName = Default;
            }

            IAuthentication<TState> auth = Get(settingName);
            SignInResponse response;
            try
            {
                response = await auth.SignInUserAsync(context, state, cancellationToken);
            }
            catch (Exception ex)
            {
                SignInResponse newResponse = new(SignInStatus.Error);
                newResponse.Error = ex;
                newResponse.Cause = AuthExceptionReason.Other;
                if (ex is AuthException authEx)
                {
                    newResponse.Cause = authEx.Cause;
                }

                return newResponse;
            }


            if (response.Status == SignInStatus.Complete)
            {
                AuthUtilities.SetTokenInState(state, settingName, response.Token!);
            }

            return response;
        }

        /// <summary>
        /// Signs out a user.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="settingName">Optional. The name of the authentication handler to use. If not specified, the default handler name is used.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        public async Task SignOutUserAsync(ITurnContext context, TState state, string? settingName = null, CancellationToken cancellationToken = default)
        {
            if (settingName == null)
            {
                settingName = Default;
            }

            IAuthentication<TState> auth = Get(settingName);
            await auth.SignOutUserAsync(context, state, cancellationToken);
            AuthUtilities.DeleteTokenFromState(state, settingName);
        }

        /// <summary>
        /// Get an authentication class via name
        /// </summary>
        /// <param name="name">The name of authentication class</param>
        /// <returns>The authentication class</returns>
        /// <exception cref="TeamsAIException">When cannot find the class with given name</exception>
        public IAuthentication<TState> Get(string name)
        {
            if (_authentications.ContainsKey(name))
            {
                return _authentications[name];
            }

            throw new TeamsAIException($"Could not find authentication handler with name '{name}'.");
        }
    }
}
