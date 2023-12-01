using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Authentication utilities
    /// </summary>
    internal class AuthUtilities
    {
        public const string IS_SIGNED_IN_KEY = "__InSignInFlow__";

        /// <summary>
        /// Set token in state
        /// </summary>
        /// <typeparam name="TState">The type of turn state</typeparam>
        /// <param name="state">The turn state</param>
        /// <param name="name">The name of token</param>
        /// <param name="token">The value of token</param>
        public static void SetTokenInState<TState>(TState state, string name, string token) where TState : TurnState, new()
        {
            if (state.Temp.AuthTokens == null)
            {
                state.Temp.AuthTokens = new Dictionary<string, string>();
            }
            state.Temp.AuthTokens[name] = token;
        }

        /// <summary>
        /// Delete token from turn state
        /// </summary>
        /// <typeparam name="TState">The type of turn state</typeparam>
        /// <param name="state">The turn state</param>
        /// <param name="name">The name of token</param>
        public static void DeleteTokenFromState<TState>(TState state, string name) where TState : TurnState, new()
        {
            if (state.Temp.AuthTokens != null && state.Temp.AuthTokens.ContainsKey(name))
            {
                state.Temp.AuthTokens.Remove(name);
            }
        }

        /// <summary>
        /// Determines if the user is in the sign in flow.
        /// </summary>
        /// <typeparam name="TState">The turn state.</typeparam>
        /// <param name="state">The turn state.</param>
        /// <returns>The connection setting name if the user is in sign in flow. Otherwise null.</returns>
        public static string? UserInSignInFlow<TState>(TState state) where TState : TurnState, new()
        {
            string? value = state.User.Get<string>(IS_SIGNED_IN_KEY);

            if (value == string.Empty || value == null)
            {
                return null;
            }

            return value;
        }

        /// <summary>
        /// Update the turn state to indicate the user is in the sign in flow by providing the authentication setting name used.
        /// </summary>
        /// <typeparam name="TState">The turn state.</typeparam>
        /// <param name="state">The turn state.</param>
        /// <param name="settingName">The connection setting name defined when configuring the authentication options within the application class.</param>
        public static void SetUserInSignInFlow<TState>(TState state, string settingName) where TState : TurnState, new()
        {
            state.User.Set(IS_SIGNED_IN_KEY, settingName);
        }

        /// <summary>
        /// Delete the user in sign in flow state from the turn state.
        /// </summary>
        /// <typeparam name="TState">The turn state.</typeparam>
        /// <param name="state">The turn state.</param>
        public static void DeleteUserInSignInFlow<TState>(TState state) where TState : TurnState, new()
        {
            state.User.Remove(IS_SIGNED_IN_KEY);
        }
    }
}
