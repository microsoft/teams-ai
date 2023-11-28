using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Application.Authentication.Bot
{
    /// <summary>
    /// Handles authentication for bot in Teams using Teams SSO.
    /// </summary>
    public class TeamsSsoBotAuthentication<TState> : BotAuthenticationBase<TState>
        where TState : TurnState, new()
    {
        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="app">The application instance</param>
        /// <param name="name">The name of current authentication handler</param>
        /// <param name="storage">The storage to save turn state</param>
        public TeamsSsoBotAuthentication(Application<TState> app, string name, IStorage? storage = null) : base(app, name, storage)
        {
        }

        /// <summary>
        /// Continue the authentication dialog.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="dialogStateProperty">The property name for storing dialog state.</param>
        /// <returns>Dialog turn result that contains token if sign in success</returns>
        public override Task<DialogTurnResult> ContinueDialog(ITurnContext context, TState state, string dialogStateProperty)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Run or continue the authentication dialog.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="dialogStateProperty">The property name for storing dialog state.</param>
        /// <returns>Dialog turn result that contains token if sign in success</returns>
        public override Task<DialogTurnResult> RunDialog(ITurnContext context, TState state, string dialogStateProperty)
        {
            throw new NotImplementedException();
        }
    }
}
