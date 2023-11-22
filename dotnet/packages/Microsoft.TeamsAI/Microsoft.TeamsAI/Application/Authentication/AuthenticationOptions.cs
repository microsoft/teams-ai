namespace Microsoft.Teams.AI.Application.Authentication
{
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
        /// </summary>
        public string? Default { get; set; }

        /// <summary>
        /// Indicates whether the bot should start the sign in flow when the user sends a message to the bot or triggers a message extension.
        /// If the selector returns false, the bot will not start the sign in flow before routing the activity to the bot logic.
        /// </summary>
        public RouteSelector? AutoSignIn { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="AuthenticationOptions"/> class.
        /// </summary>
        /// <param name="authentications">The authentication classes to sign-in and sign-out users.</param>
        /// <param name="default">Describes the authentication class the bot should use if the user does not specify a authentication class name.</param>
        /// <param name="autoSignIn">Indicates whether the bot should start the sign in flow when the user sends a message to the bot or triggers a message extension.</param>
        public AuthenticationOptions(Dictionary<string, IAuthentication> authentications, string? @default, RouteSelector? autoSignIn)
        {
            this.Authentications = authentications;
            this.Default = @default;
            this.AutoSignIn = autoSignIn;
        }
    }
}
