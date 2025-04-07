using Microsoft.Agents.Builder;
using Microsoft.Agents.Builder.App;
using Microsoft.Agents.Builder.State;
using Microsoft.Agents.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Teams.AI.Application;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// A builder class for simplifying the creation of an Application instance.
    /// </summary>
    public class TeamsApplicationBuilder
    {
        /// <summary>
        /// Empty constructor for manual configuration
        /// </summary>
        public TeamsApplicationBuilder()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="TeamsApplicationBuilder"/> class with the specified options.
        /// </summary>
        /// <param name="options">The agent application options to leverage.</param>
        public TeamsApplicationBuilder(TeamsAgentApplicationOptions options)
        {
            Options = options ?? throw new ArgumentNullException(nameof(options));
        }

        /// <summary>
        /// The application's configured options.
        /// </summary>
        public TeamsAgentApplicationOptions Options { get; } = new();

        /// <summary>
        /// Configures the application to use long running messages.
        /// Default state for longRunningMessages is false
        /// </summary>
        /// <param name="adapter">The adapter to use for routing incoming requests.</param>
        /// <param name="botAppId">The Microsoft App ID for the bot.</param>
        /// <returns>The TeamsApplicationBuilder instance.</returns>
        public TeamsApplicationBuilder WithLongRunningMessages(IChannelAdapter adapter, string botAppId)
        {
            if (string.IsNullOrEmpty(botAppId))
            {
                throw new ArgumentException("The ApplicationOptions.LongRunningMessages property is unavailable because botAppId cannot be null or undefined.");
            }

            Options.LongRunningMessages = true;
            Options.Adapter = adapter;
            Options.BotAppId = botAppId;
            return this;
        }

        /// <summary>
        /// Configures the storage system to use for storing the bot's state.
        /// </summary>
        /// <param name="storage">The storage system to use.</param>
        /// <returns>The TeamsApplicationBuilder instance.</returns>
        public TeamsApplicationBuilder WithStorage(IStorage storage)
        {
            Options.Storage = storage;
            return this;
        }

        /// <summary>
        /// Configures the turn state factory to use for managing the bot's turn state.
        /// </summary>
        /// <param name="turnStateFactory">The turn state factory to use.</param>
        /// <returns>The ApplicationBuilder instance.</returns>
        public TeamsApplicationBuilder WithTurnStateFactory(Func<ITurnState> turnStateFactory)
        {
            Options.TurnStateFactory = turnStateFactory;
            return this;
        }

        /// <summary>
        /// Configures the Logger factory for the application
        /// </summary>
        /// <param name="loggerFactory">The Logger factory</param>
        /// <returns>The ApplicationBuilder instance.</returns>
        public TeamsApplicationBuilder WithLoggerFactory(ILoggerFactory loggerFactory)
        {
            Options.LoggerFactory = loggerFactory;
            return this;
        }

        /// <summary>
        /// Configures the processing of Adaptive Card requests.
        /// </summary>
        /// <param name="adaptiveCardOptions">The options for Adaptive Cards.</param>
        /// <returns>The ApplicationBuilder instance.</returns>
        public TeamsApplicationBuilder WithAdaptiveCardOptions(Agents.Builder.App.AdaptiveCards.AdaptiveCardsOptions adaptiveCardOptions)
        {
            Options.AdaptiveCards = adaptiveCardOptions;
            return this;
        }

        /// <summary>
        /// Configures the removing of mentions of the bot's name from incoming messages.
        /// Default state for removeRecipientMention is true
        /// </summary>
        /// <param name="removeRecipientMention">The boolean for removing recipient mentions.</param>
        /// <returns>The ApplicationBuilder instance.</returns>
        public TeamsApplicationBuilder SetRemoveRecipientMention(bool removeRecipientMention)
        {
            Options.RemoveRecipientMention = removeRecipientMention;
            return this;
        }

        /// <summary>
        /// Configures the typing timer when messages are received.
        /// Default state for startTypingTimer is true
        /// </summary>
        /// <param name="startTypingTimer">The boolean for starting the typing timer.</param>
        /// <returns>The ApplicationBuilder instance.</returns>
        public TeamsApplicationBuilder SetStartTypingTimer(bool startTypingTimer)
        {
            Options.StartTypingTimer = startTypingTimer;
            return this;
        }

        /// <summary>
        /// Builds and returns a new Application instance.
        /// </summary>
        /// <returns>The Application instance.</returns>
        public TeamsApplication Build()
        {
            return new TeamsApplication(Options);
        }
    }
}
