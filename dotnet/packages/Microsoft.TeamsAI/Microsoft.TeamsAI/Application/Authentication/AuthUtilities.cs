using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Authentication utilities
    /// </summary>
    public class AuthUtilities
    {
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
    }
}
