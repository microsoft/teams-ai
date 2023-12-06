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
        private protected Dictionary<string, IAuthentication<TState>> _authentications { get; }

        /// <summary>
        /// The default authentication setting name.
        /// </summary>
        public string Default { get; }

        /// <summary>
        /// Creates a new instance of the class
        /// </summary>
        /// <param name="app">The application.</param>
        /// <param name="options">The authentication options</param>
        /// <param name="storage">The storage to use.</param>
        /// <exception cref="TeamsAIException">Throws when the options does not contain authentication handlers</exception>
        public AuthenticationManager(Application<TState> app, AuthenticationOptions<TState> options, IStorage? storage)
        {
            if (options._authenticationSettings.Count == 0)
            {
                throw new TeamsAIException("Authentications setting is empty");
            }

            _authentications = new Dictionary<string, IAuthentication<TState>>();

            // If developer does not specify default authentication, set default to the first one in the options
            Default = options.Default ?? options._authenticationSettings.First().Key;

            foreach (string key in options._authenticationSettings.Keys)
            {
                object setting = options._authenticationSettings[key];
                if (setting is OAuthSettings oauthSetting)
                {
                    _authentications.Add(key, new OAuthAuthentication<TState>(app, key, oauthSetting, storage));
                }
                else if (setting is TeamsSsoSettings teamsSsoSettings)
                {
                    _authentications.Add(key, new TeamsSsoAuthentication<TState>(app, key, teamsSsoSettings, storage));
                }
            }
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
            string? token;
            try
            {
                token = await auth.SignInUserAsync(context, state, cancellationToken);
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


            if (token != null)
            {
                AuthUtilities.SetTokenInState(state, settingName, token);
                return new SignInResponse(SignInStatus.Complete);
            }

            return new SignInResponse(SignInStatus.Pending);
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
