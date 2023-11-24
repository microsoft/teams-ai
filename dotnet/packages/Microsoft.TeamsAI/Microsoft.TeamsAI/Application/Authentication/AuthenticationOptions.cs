using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI
{

    /// <summary>
    /// Function for determining whether authentication should be enabled for an activity.
    /// </summary>
    /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>True if authentication should be enabled. Otherwise, False.</returns>
    public delegate Task<bool> SelectorAsync(ITurnContext turnContext, CancellationToken cancellationToken);

    /// <summary>
    /// Options for authentication.
    /// </summary>
    public class AuthenticationOptions
    {
        /// <summary>
        /// The authentication classes to sign-in and sign-out users.
        /// Key uniquely identifies each authentication.
        /// </summary>
        public Dictionary<string, IAuthentication> Authentications { get; set; }

        /// <summary>
        /// Describes the authentication class the bot should use if the user does not specify a authentication class name.
        /// If the value is not provided, the first one in `Authentications` setting will be used as the default one.
        /// </summary>
        public string? Default { get; set; }

        /// <summary>
        /// Indicates whether the bot should start the sign in flow when the user sends a message to the bot or triggers a message extension.
        /// If the selector returns false, the bot will not start the sign in flow before routing the activity to the bot logic.
        /// If the selector is not provided, the sign in will always happen for valid activities.
        /// </summary>
        public SelectorAsync? AutoSignIn { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="AuthenticationOptions"/> class.
        /// </summary>
        /// <param name="authentications">The authentication classes to sign-in and sign-out users.</param>
        /// <param name="default">Describes the authentication class the bot should use if the user does not specify a authentication class name.</param>
        /// <param name="autoSignIn">Indicates whether the bot should start the sign in flow when the user sends a message to the bot or triggers a message extension.</param>
        public AuthenticationOptions(Dictionary<string, IAuthentication> authentications, string? @default = null, SelectorAsync? autoSignIn = null)
        {
            this.Authentications = authentications;
            this.Default = @default;
            this.AutoSignIn = autoSignIn;
        }
    }
}
