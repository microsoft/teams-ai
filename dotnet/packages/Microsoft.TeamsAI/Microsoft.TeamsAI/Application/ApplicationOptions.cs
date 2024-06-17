using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.State;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.Application;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Options for the <see cref="Application{TState}"/> class.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state.</typeparam>
    public class ApplicationOptions<TState>
        where TState : TurnState, new()
    {
        /// <summary>
        /// Optional. Teams Bot adapter being used.
        /// </summary>
        /// <remarks>
        /// If using the <see cref="ApplicationOptions{TState}.LongRunningMessages"/> option, calling the <see cref="CloudAdapterBase.ContinueConversationAsync(string, Bot.Schema.Activity, BotCallbackHandler, CancellationToken)"/> method, or configuring user authentication, this property is required.
        /// </remarks>
        public TeamsAdapter? Adapter { get; set; }

        /// <summary>
        /// Optional. Application ID of the bot.
        /// </summary>
        /// <remarks>
        /// If using the <see cref="ApplicationOptions{TState}.LongRunningMessages"/> option, calling the <see cref="CloudAdapterBase.ContinueConversationAsync(string, Bot.Schema.Activity, BotCallbackHandler, CancellationToken)"/> method, or configuring user authentication, this property is required.
        /// </remarks>
        public string? BotAppId { get; set; }

        /// <summary>
        /// Optional. Storage provider to use for the application.
        /// </summary>
        public IStorage? Storage { get; set; }

        /// <summary>
        /// Optional. Options used to customize the processing of Adaptive Card requests.
        /// </summary>
        public AdaptiveCardsOptions? AdaptiveCards { get; set; }

        /// <summary>
        /// Optional. Options used to customize the processing of Task Modules requests.
        /// </summary>
        public TaskModulesOptions? TaskModules { get; set; }

        /// <summary>
        /// Optional. AI options to use. When provided, a new instance of the AI system will be created.
        /// </summary>
        public AIOptions<TState>? AI { get; set; }

        /// <summary>
        /// Optional. Factory used to create a custom turn state instance.
        /// </summary>
        public Func<TState>? TurnStateFactory { get; set; }

        /// <summary>
        /// Optional. Array of input file download plugins to use.
        /// </summary>
        public IList<IInputFileDownloader<TState>>? FileDownloaders { get; set; }

        /// <summary>
        /// Optional. Logger factory that will be used in this application.
        /// </summary>
        /// <remarks>
        /// </remarks>
        public ILoggerFactory? LoggerFactory { get; set; }

        /// <summary>
        /// Optional. If true, the bot will automatically remove mentions of the bot's name from incoming
        /// messages. Defaults to true.
        /// </summary>
        public bool RemoveRecipientMention { get; set; } = true;

        /// <summary>
        /// Optional. If true, the bot will automatically start a typing timer when messages are received.
        /// This allows the bot to automatically indicate that it's received the message and is processing
        /// the request. Defaults to true.
        /// </summary>
        public bool StartTypingTimer { get; set; } = true;

        /// <summary>
        /// Optional. If true, the bot supports long running messages that can take longer then the 10 - 15
        /// second timeout imposed by most channels. Defaults to false.
        /// </summary>
        /// <remarks>
        /// This works by immediately converting the incoming request to a proactive conversation. Care should
        /// be used for bots that operate in a shared hosting environment. The incoming request is immediately
        /// completed and many shared hosting environments will mark the bot's process as idle and shut it down.
        /// </remarks>
        public bool LongRunningMessages { get; set; } = false;

        /// <summary>
        /// Optional. Options used to enable authentication for the application.
        /// </summary>
        public AuthenticationOptions<TState>? Authentication { get; set; }
    }
}
