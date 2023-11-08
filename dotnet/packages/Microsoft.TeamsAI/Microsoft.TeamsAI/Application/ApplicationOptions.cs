using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.State;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Options for the <see cref="Application{TState, TTurnStateManager}"/> class.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state.</typeparam>
    /// <typeparam name="TTurnStateManager">Type of the turn state manager.</typeparam>
    public class ApplicationOptions<TState, TTurnStateManager>
        where TState : ITurnState<StateBase, StateBase, TempState>
        where TTurnStateManager : ITurnStateManager<TState>
    {
        /// <summary>
        /// Optional. Bot adapter being used.
        /// </summary>
        /// <remarks>
        /// If using the LongRunningMessages option or calling the ContinueConversationAsync method, this property is required.
        /// </remarks>
        public BotAdapter? Adapter { get; set; }

        /// <summary>
        /// Optional. Application ID of the bot.
        /// </summary>
        /// <remarks>
        /// If using the <see cref="ApplicationOptions{TState, TTurnStateManager}.LongRunningMessages"/> option or calling the <see cref="CloudAdapterBase.ContinueConversationAsync(string, Bot.Schema.Activity, BotCallbackHandler, CancellationToken)"/> method, this property is required.
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
        /// Optional. Turn state manager to use. If omitted, an instance of TTurnStateManager will
        /// be created using the parameterless constructor.
        /// </summary>
        public TTurnStateManager? TurnStateManager { get; set; }

        /// <summary>
        /// Optional. Logger factory that will be used in this application.
        /// </summary>
        /// <remarks>
        /// <see cref="AI.Planner.OpenAIPlanner{TState, TOptions}"/> and <see cref="AI.Planner.AzureOpenAIPlanner{TState}"/> prompt completion data will is logged at the <see cref="LogLevel.Information"/> level.
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
    }
}
