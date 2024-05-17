using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.Application;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Newtonsoft.Json.Linq;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Application class for routing and processing incoming requests.
    /// </summary>
    /// <remarks>
    /// The Application object replaces the traditional ActivityHandler that a bot would use. It supports
    /// a simpler fluent style of authoring bots versus the inheritance based approach used by the
    /// ActivityHandler class.
    ///
    /// Additionally, it has built-in support for calling into the SDK's AI system and can be used to create
    /// bots that leverage Large Language Models (LLM) and other AI capabilities.
    /// </remarks>
    /// <typeparam name="TState">Type of the turnState. This allows for strongly typed access to the turn turnState.</typeparam>
    public class Application<TState> : IBot
        where TState : TurnState, new()
    {
        private static readonly string CONFIG_FETCH_INVOKE_NAME = "config/fetch";
        private static readonly string CONFIG_SUBMIT_INVOKE_NAME = "config/submit";

        private readonly AI<TState>? _ai;
        private readonly BotAdapter? _adapter;
        private readonly AuthenticationManager<TState>? _authentication;

        private readonly int _typingTimerDelay = 1000;
        private TypingTimer? _typingTimer;

        private readonly ConcurrentQueue<Route<TState>> _invokeRoutes;
        private readonly ConcurrentQueue<Route<TState>> _routes;

        private readonly ConcurrentQueue<TurnEventHandlerAsync<TState>> _beforeTurn;
        private readonly ConcurrentQueue<TurnEventHandlerAsync<TState>> _afterTurn;

        private readonly SelectorAsync? _startSignIn;

        /// <summary>
        /// Creates a new Application instance.
        /// </summary>
        /// <param name="options">Optional. Options used to configure the application.</param>
        public Application(ApplicationOptions<TState> options)
        {
            Verify.ParamNotNull(options);

            Options = options;

            if (Options.TurnStateFactory == null)
            {
                this.Options.TurnStateFactory = () => new TState();
            }

            if (Options.AI != null)
            {
                _ai = new AI<TState>(Options.AI, Options.LoggerFactory);
            }

            if (Options.Adapter != null)
            {
                _adapter = Options.Adapter;
            }

            AdaptiveCards = new AdaptiveCards<TState>(this);
            Meetings = new Meetings<TState>(this);
            MessageExtensions = new MessageExtensions<TState>(this);
            TaskModules = new TaskModules<TState>(this);

            // Validate long running messages configuration
            if (Options.LongRunningMessages && (Options.Adapter == null || Options.BotAppId == null))
            {
                throw new ArgumentException("The ApplicationOptions.LongRunningMessages property is unavailable because no adapter or botAppId was configured.");
            }

            _routes = new ConcurrentQueue<Route<TState>>();
            _invokeRoutes = new ConcurrentQueue<Route<TState>>();
            _beforeTurn = new ConcurrentQueue<TurnEventHandlerAsync<TState>>();
            _afterTurn = new ConcurrentQueue<TurnEventHandlerAsync<TState>>();

            if (options.Authentication != null)
            {
                _authentication = new AuthenticationManager<TState>(this, options.Authentication, options.Storage);

                if (options.Authentication.AutoSignIn != null)
                {
                    _startSignIn = options.Authentication.AutoSignIn;
                }
                else
                {
                    _startSignIn = (context, cancellationToken) => Task.FromResult(true);
                }
            }
        }

        /// <summary>
        /// Fluent interface for accessing Adaptive Card specific features.
        /// </summary>
        public AdaptiveCards<TState> AdaptiveCards { get; }

        /// <summary>
        /// Fluent interface for accessing Meetings' specific features.
        /// </summary>
        public Meetings<TState> Meetings { get; }

        /// <summary>
        /// Fluent interface for accessing Message Extensions' specific features.
        /// </summary>
        public MessageExtensions<TState> MessageExtensions { get; }

        /// <summary>
        /// Fluent interface for accessing Task Modules' specific features.
        /// </summary>
        public TaskModules<TState> TaskModules { get; }

        /// <summary>
        /// Accessing authentication specific features.
        /// </summary>
        public AuthenticationManager<TState> Authentication
        {

            get
            {
                if (_authentication == null)
                {
                    throw new ArgumentException("The Application.Authentication property is unavailable because no authentication options were configured.");
                }

                return _authentication;
            }
        }

        /// <summary>
        /// Fluent interface for accessing AI specific features.
        /// </summary>
        /// <remarks>
        /// This property is only available if the Application was configured with 'ai' options. An
        /// exception will be thrown if you attempt to access it otherwise.
        /// </remarks>
        public AI<TState> AI
        {
            get
            {
                if (_ai == null)
                {
                    throw new ArgumentException("The Application.AI property is unavailable because no AI options were configured.");
                }

                return _ai;
            }
        }

        /// <summary>
        /// Fluent interface for accessing the bot adapter used to configure the application.
        /// </summary>
        public BotAdapter Adapter
        {
            get
            {
                if (_adapter == null)
                {
                    throw new ArgumentException("The Application.Adapter property is unavailable because it was not configured.");
                }

                return _adapter;
            }
        }

        /// <summary>
        /// The application's configured options.
        /// </summary>
        public ApplicationOptions<TState> Options { get; }

        /// <summary>
        /// Adds a new route to the application.
        /// 
        /// Developers won't typically need to call this method directly as it's used internally by all
        /// of the fluent interfaces to register routes for their specific activity types.
        /// 
        /// Routes will be matched in the order they're added to the application. The first selector to
        /// return `true` when an activity is received will have its handler called.
        ///
        /// Invoke-based activities receive special treatment and are matched separately as they typically
        /// have shorter execution timeouts.
        /// </summary>
        /// <param name="selector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <param name="isInvokeRoute">Boolean indicating if the RouteSelectorAsync is for an activity that uses "invoke" which require special handling. Defaults to `false`.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> AddRoute(RouteSelectorAsync selector, RouteHandler<TState> handler, bool isInvokeRoute = false)
        {
            Verify.ParamNotNull(selector);
            Verify.ParamNotNull(handler);
            Route<TState> route = new(selector, handler, isInvokeRoute);
            if (isInvokeRoute)
            {
                _invokeRoutes.Enqueue(route);
            }
            else
            {
                _routes.Enqueue(route);
            }
            return this;
        }

        /// <summary>
        /// Handles incoming activities of a given type.
        /// </summary>
        /// <param name="type">Name of the activity type to match.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnActivity(string type, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(type);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _) => Task.FromResult(string.Equals(type, context.Activity?.Type, StringComparison.OrdinalIgnoreCase));
            OnActivity(routeSelector, handler);
            return this;
        }

        /// <summary>
        /// Handles incoming activities of a given type.
        /// </summary>
        /// <param name="typePattern">Regular expression to match against the incoming activity type.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnActivity(Regex typePattern, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(typePattern);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _) => Task.FromResult(context.Activity?.Type != null && typePattern.IsMatch(context.Activity?.Type));
            OnActivity(routeSelector, handler);
            return this;
        }

        /// <summary>
        /// Handles incoming activities of a given type.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnActivity(RouteSelectorAsync routeSelector, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            AddRoute(routeSelector, handler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles incoming activities of a given type.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelectorAsync selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnActivity(MultipleRouteSelector routeSelectors, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string type in routeSelectors.Strings)
                {
                    OnActivity(type, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex typePattern in routeSelectors.Regexes)
                {
                    OnActivity(typePattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelectorAsync routeSelector in routeSelectors.RouteSelectors)
                {
                    OnActivity(routeSelector, handler);
                }
            }
            return this;
        }

        /// <summary>
        /// Handles conversation update events.
        /// </summary>
        /// <param name="conversationUpdateEvent">Name of the conversation update event to handle, can use <see cref="ConversationUpdateEvents"/>.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnConversationUpdate(string conversationUpdateEvent, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(conversationUpdateEvent);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector;
            switch (conversationUpdateEvent)
            {
                case ConversationUpdateEvents.ChannelCreated:
                case ConversationUpdateEvents.ChannelDeleted:
                case ConversationUpdateEvents.ChannelRenamed:
                case ConversationUpdateEvents.ChannelRestored:
                {
                    routeSelector = (context, _) => Task.FromResult
                    (
                        string.Equals(context.Activity?.ChannelId, Channels.Msteams)
                        && string.Equals(context.Activity?.Type, ActivityTypes.ConversationUpdate, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(context.Activity?.GetChannelData<TeamsChannelData>()?.EventType, conversationUpdateEvent)
                        && context.Activity?.GetChannelData<TeamsChannelData>()?.Channel != null
                        && context.Activity?.GetChannelData<TeamsChannelData>()?.Team != null
                    );
                    break;
                }
                case ConversationUpdateEvents.MembersAdded:
                {
                    routeSelector = (context, _) => Task.FromResult
                    (
                        string.Equals(context.Activity?.Type, ActivityTypes.ConversationUpdate, StringComparison.OrdinalIgnoreCase)
                        && context.Activity?.MembersAdded != null
                        && context.Activity.MembersAdded.Count > 0
                    );
                    break;
                }
                case ConversationUpdateEvents.MembersRemoved:
                {
                    routeSelector = (context, _) => Task.FromResult
                    (
                        string.Equals(context.Activity?.Type, ActivityTypes.ConversationUpdate, StringComparison.OrdinalIgnoreCase)
                        && context.Activity?.MembersRemoved != null
                        && context.Activity.MembersRemoved.Count > 0
                    );
                    break;
                }
                case ConversationUpdateEvents.TeamRenamed:
                case ConversationUpdateEvents.TeamDeleted:
                case ConversationUpdateEvents.TeamHardDeleted:
                case ConversationUpdateEvents.TeamArchived:
                case ConversationUpdateEvents.TeamUnarchived:
                case ConversationUpdateEvents.TeamRestored:
                {
                    routeSelector = (context, _) => Task.FromResult
                    (
                        string.Equals(context.Activity?.ChannelId, Channels.Msteams)
                        && string.Equals(context.Activity?.Type, ActivityTypes.ConversationUpdate, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(context.Activity?.GetChannelData<TeamsChannelData>()?.EventType, conversationUpdateEvent)
                        && context.Activity?.GetChannelData<TeamsChannelData>()?.Team != null
                    );
                    break;
                }
                default:
                {
                    routeSelector = (context, _) => Task.FromResult
                    (
                        string.Equals(context.Activity?.ChannelId, Channels.Msteams)
                        && string.Equals(context.Activity?.Type, ActivityTypes.ConversationUpdate, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(context.Activity?.GetChannelData<TeamsChannelData>()?.EventType, conversationUpdateEvent)
                    );
                    break;
                }
            }
            AddRoute(routeSelector, handler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles conversation update events.
        /// </summary>
        /// <param name="conversationUpdateEvents">Name of the conversation update events to handle, can use <see cref="ConversationUpdateEvents"/> as array item.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnConversationUpdate(string[] conversationUpdateEvents, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(conversationUpdateEvents);
            Verify.ParamNotNull(handler);
            foreach (string conversationUpdateEvent in conversationUpdateEvents)
            {
                OnConversationUpdate(conversationUpdateEvent, handler);
            }
            return this;
        }

        /// <summary>
        /// Handles incoming messages with a given keyword.
        /// <br/>
        /// This method provides a simple way to have a bot respond anytime a user sends your bot a
        /// message with a specific word or phrase.
        /// <br/>
        /// For example, you can easily clear the current conversation anytime a user sends "/reset":
        /// <br/>
        /// <code>application.OnMessage("/reset", (context, turnState, _) => ...);</code>
        /// </summary>
        /// <param name="text">Substring of the incoming message text.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessage(string text, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(text);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _)
                => Task.FromResult
                (
                    string.Equals(ActivityTypes.Message, context.Activity?.Type, StringComparison.OrdinalIgnoreCase)
                    && context.Activity?.Text != null
                    && context.Activity.Text.IndexOf(text, StringComparison.OrdinalIgnoreCase) >= 0
                );
            OnMessage(routeSelector, handler);
            return this;
        }

        /// <summary>
        /// Handles incoming messages with a given keyword.
        /// <br/>
        /// This method provides a simple way to have a bot respond anytime a user sends your bot a
        /// message with a specific word or phrase.
        /// <br/>
        /// For example, you can easily clear the current conversation anytime a user sends "/reset":
        /// <br/>
        /// <code>application.OnMessage(new Regex("reset"), (context, turnState, _) => ...);</code>
        /// </summary>
        /// <param name="textPattern">Regular expression to match against the text of an incoming message.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessage(Regex textPattern, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(textPattern);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _)
                => Task.FromResult
                (
                    string.Equals(ActivityTypes.Message, context.Activity?.Type, StringComparison.OrdinalIgnoreCase)
                    && context.Activity?.Text != null
                    && textPattern.IsMatch(context.Activity.Text)
                );
            OnMessage(routeSelector, handler);
            return this;
        }

        /// <summary>
        /// Handles incoming messages with a given keyword.
        /// <br/>
        /// This method provides a simple way to have a bot respond anytime a user sends your bot a
        /// message with a specific word or phrase.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessage(RouteSelectorAsync routeSelector, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            AddRoute(routeSelector, handler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles incoming messages with a given keyword.
        /// <br/>
        /// This method provides a simple way to have a bot respond anytime a user sends your bot a
        /// message with a specific word or phrase.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelectorAsync selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessage(MultipleRouteSelector routeSelectors, RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string text in routeSelectors.Strings)
                {
                    OnMessage(text, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex textPattern in routeSelectors.Regexes)
                {
                    OnMessage(textPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelectorAsync routeSelector in routeSelectors.RouteSelectors)
                {
                    OnMessage(routeSelector, handler);
                }
            }
            return this;
        }

        /// <summary>
        /// Handles message edit events.
        /// </summary>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessageEdit(RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
            {
                TeamsChannelData teamsChannelData;
                return Task.FromResult(
                    string.Equals(turnContext.Activity.Type, ActivityTypes.MessageUpdate, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.ChannelId, Channels.Msteams)
                    && (teamsChannelData = turnContext.Activity.GetChannelData<TeamsChannelData>()) != null
                    && string.Equals(teamsChannelData.EventType, "editMessage"));
            };
            AddRoute(routeSelector, handler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles message undo soft delete events.
        /// </summary>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessageUndelete(RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
            {
                TeamsChannelData teamsChannelData;
                return Task.FromResult(
                    string.Equals(turnContext.Activity.Type, ActivityTypes.MessageUpdate, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.ChannelId, Channels.Msteams)
                    && (teamsChannelData = turnContext.Activity.GetChannelData<TeamsChannelData>()) != null
                    && string.Equals(teamsChannelData.EventType, "undeleteMessage"));
            };
            AddRoute(routeSelector, handler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles message soft delete events.
        /// </summary>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessageDelete(RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
            {
                TeamsChannelData teamsChannelData;
                return Task.FromResult(
                    string.Equals(turnContext.Activity.Type, ActivityTypes.MessageDelete, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.ChannelId, Channels.Msteams)
                    && (teamsChannelData = turnContext.Activity.GetChannelData<TeamsChannelData>()) != null
                    && string.Equals(teamsChannelData.EventType, "softDeleteMessage"));
            };
            AddRoute(routeSelector, handler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles message reactions added events.
        /// </summary>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessageReactionsAdded(RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.MessageReaction, StringComparison.OrdinalIgnoreCase)
                && context.Activity?.ReactionsAdded != null
                && context.Activity.ReactionsAdded.Count > 0
            );
            AddRoute(routeSelector, handler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles message reactions removed events.
        /// </summary>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnMessageReactionsRemoved(RouteHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.MessageReaction, StringComparison.OrdinalIgnoreCase)
                && context.Activity?.ReactionsRemoved != null
                && context.Activity.ReactionsRemoved.Count > 0
            );
            AddRoute(routeSelector, handler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles read receipt events for messages sent by the bot in personal scope.
        /// </summary>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnTeamsReadReceipt(ReadReceiptHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.Event, StringComparison.OrdinalIgnoreCase)
                && string.Equals(context.Activity?.ChannelId, Channels.Msteams)
                && string.Equals(context.Activity?.Name, "application/vnd.microsoft.readReceipt")
            );
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                ReadReceiptInfo readReceiptInfo = ActivityUtilities.GetTypedValue<ReadReceiptInfo>(turnContext.Activity) ?? new();
                await handler(turnContext, turnState, readReceiptInfo, cancellationToken);
            };
            AddRoute(routeSelector, routeHandler, isInvokeRoute: false);
            return this;
        }

        /// <summary>
        /// Handles config fetch events for Microsoft Teams.
        /// </summary>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnConfigFetch(ConfigHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) => Task.FromResult(
                string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                && string.Equals(turnContext.Activity.Name, CONFIG_FETCH_INVOKE_NAME)
                && string.Equals(turnContext.Activity.ChannelId, Channels.Msteams));
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                ConfigResponseBase result = await handler(turnContext, turnState, turnContext.Activity.Value, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(result);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return this;
        }

        /// <summary>
        /// Handles config submit events for Microsoft Teams.
        /// </summary>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnConfigSubmit(ConfigHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) => Task.FromResult(
                string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                && string.Equals(turnContext.Activity.Name, CONFIG_SUBMIT_INVOKE_NAME)
                && string.Equals(turnContext.Activity.ChannelId, Channels.Msteams));
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                ConfigResponseBase result = await handler(turnContext, turnState, turnContext.Activity.Value, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(result);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return this;
        }

        /// <summary>
        /// Handles when a file consent card is accepted by the user.
        /// </summary>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnFileConsentAccept(FileConsentHandler<TState> handler)
            => OnFileConsent(handler, "accept");

        /// <summary>
        /// Handles when a file consent card is declined by the user.
        /// </summary>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnFileConsentDecline(FileConsentHandler<TState> handler)
            => OnFileConsent(handler, "decline");

        private Application<TState> OnFileConsent(FileConsentHandler<TState> handler, string fileConsentAction)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _) =>
            {
                FileConsentCardResponse? fileConsentCardResponse;
                return Task.FromResult
                (
                    string.Equals(context.Activity?.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(context.Activity?.Name, "fileConsent/invoke")
                    && (fileConsentCardResponse = ActivityUtilities.GetTypedValue<FileConsentCardResponse>(context.Activity!)) != null
                    && string.Equals(fileConsentCardResponse.Action, fileConsentAction)
                );
            };
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                FileConsentCardResponse fileConsentCardResponse = ActivityUtilities.GetTypedValue<FileConsentCardResponse>(turnContext.Activity) ?? new();
                await handler(turnContext, turnState, fileConsentCardResponse, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity();
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return this;
        }

        /// <summary>
        /// Handles O365 Connector Card Action activities.
        /// </summary>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnO365ConnectorCardAction(O365ConnectorCardActionHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                && string.Equals(context.Activity?.Name, "actionableMessage/executeAction")
            );
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                O365ConnectorCardActionQuery query = ActivityUtilities.GetTypedValue<O365ConnectorCardActionQuery>(turnContext.Activity) ?? new();
                await handler(turnContext, turnState, query, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity();
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return this;
        }

        /// <summary>
        /// Handles handoff activities.
        /// </summary>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnHandoff(HandoffHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                && string.Equals(context.Activity?.Name, "handoff/action")
            );
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                string token = turnContext.Activity.Value.GetType().GetProperty("Continuation").GetValue(turnContext.Activity.Value) as string;
                await handler(turnContext, turnState, token, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity();
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return this;
        }

        /// <summary>
        /// Registers a handler for feedback loop events when a user clicks the thumbsup or thumbsdown button on a response sent from the AI module.
        /// <see cref="AIOptions{TState}.EnableFeedbackLoop"/> must be set to true.
        /// </summary>
        /// <param name="handler">Function to cal lwhen the route is triggered</param>
        /// <returns></returns>
        public Application<TState> OnFeedbackLoop(FeedbackLoopHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);

            RouteSelectorAsync routeSelector = (context, _) =>
            {

                string? actionName = (context.Activity.Value as JObject)?.GetValue("actionName")?.Value<string>();
                return Task.FromResult
                (
                    context.Activity.Type == ActivityTypes.Invoke
                    && context.Activity.Name == "message/submitAction"
                    && actionName == "feedback"
                );
            };

            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                FeedbackLoopData feedbackLoopData = ActivityUtilities.GetTypedValue<FeedbackLoopData>(turnContext.Activity)!;
                feedbackLoopData.ReplyToId = turnContext.Activity.ReplyToId;

                await handler(turnContext, turnState, feedbackLoopData, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity();
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };

            AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return this;
        }

        /// <summary>
        /// Add a handler that will execute before the turn's activity handler logic is processed.
        /// <br/>
        /// Handler returns true to continue execution of the current turn. Handler returning false
        /// prevents the turn from running, but the bots state is still saved, which lets you
        /// track the reason why the turn was not processed. It also means you can use this as
        /// a way to call into the dialog system. For example, you could use the OAuthPrompt to sign the
        /// user in before allowing the AI system to run.
        /// </summary>
        /// <param name="handler">Function to call before turn execution.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnBeforeTurn(TurnEventHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(handler);
            _beforeTurn.Enqueue(handler);
            return this;
        }

        /// <summary>
        /// Add a handler that will execute after the turn's activity handler logic is processed.
        /// <br/>
        /// Handler returns true to finish execution of the current turn. Handler returning false
        /// prevents the bots state from being saved.
        /// </summary>
        /// <param name="handler">Function to call after turn execution.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnAfterTurn(TurnEventHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(handler);
            _afterTurn.Enqueue(handler);
            return this;
        }

        /// <summary>
        /// Called by the adapter (for example, a <see cref="CloudAdapter"/>)
        /// at runtime in order to process an inbound <see cref="Activity"/>.
        /// </summary>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        public async Task OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            if (turnContext == null)
            {
                throw new ArgumentNullException(nameof(turnContext));
            }

            if (turnContext.Activity == null)
            {
                throw new ArgumentException($"{nameof(turnContext)} must have non-null Activity.");
            }

            if (turnContext.Activity.Type == null)
            {
                throw new ArgumentException($"{nameof(turnContext)}.Activity must have non-null Type.");
            }

            await _StartLongRunningCall(turnContext, _OnTurnAsync, cancellationToken);
        }

        // TODO: Make TypingTimer thread-safe and work for each turn
        /// <summary>
        /// Manually start a timer to periodically send "typing" activities.
        /// </summary>
        /// <remarks>
        /// The timer waits 1000ms to send its initial "typing" activity and then send an additional
        /// "typing" activity every 1000ms.The timer will automatically end once an outgoing activity
        /// has been sent. If the timer is already running or the current activity is not a "message"
        /// the call is ignored.
        /// </remarks>
        /// <param name="turnContext">The turn context.</param>
        public void StartTypingTimer(ITurnContext turnContext)
        {
            if (turnContext.Activity.Type != ActivityTypes.Message)
            {
                return;
            }

            if (_typingTimer == null)
            {
                _typingTimer = new TypingTimer(_typingTimerDelay);
            }

            if (_typingTimer.IsRunning() == false)
            {
                _typingTimer.Start(turnContext);
            }

        }

        /// <summary>
        /// Manually stop the typing timer.
        /// </summary>
        /// <remarks>
        /// If the timer isn't running nothing happens.
        /// </remarks>
        public void StopTypingTimer()
        {
            _typingTimer?.Dispose();
            _typingTimer = null;
        }

        /// <summary>
        /// Internal method to wrap the logic of handling a bot turn.
        /// </summary>
        private async Task _OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            try
            {
                // Start typing timer if configured
                if (Options.StartTypingTimer)
                {
                    StartTypingTimer(turnContext);
                };

                // Remove @mentions
                if (Options.RemoveRecipientMention && ActivityTypes.Message.Equals(turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase))
                {
                    turnContext.Activity.Text = turnContext.Activity.RemoveRecipientMention();
                }

                // Load turn state
                TState turnState = Options.TurnStateFactory!();
                IStorage? storage = Options.Storage;

                await turnState!.LoadStateAsync(storage, turnContext);

                // If user is in sign in flow, return the authentication setting name
                string? settingName = AuthUtilities.UserInSignInFlow(turnState);
                bool shouldStartSignIn = _startSignIn != null && await _startSignIn(turnContext, cancellationToken);

                // Sign the user in
                if (this._authentication != null && (shouldStartSignIn || settingName != null))
                {
                    if (settingName == null)
                    {
                        settingName = this._authentication.Default;
                    }

                    // Sets the setting name in the context object. It is used in `signIn/verifyState` & `signIn/tokenExchange` route selectors.
                    BotAuthenticationBase<TState>.SetSettingNameInContextActivityValue(turnContext, settingName);

                    SignInResponse response = await this._authentication.SignUserInAsync(turnContext, turnState, settingName);

                    if (response.Status == SignInStatus.Complete)
                    {
                        AuthUtilities.DeleteUserInSignInFlow(turnState);
                    }

                    if (response.Status == SignInStatus.Pending)
                    {
                        // Requires user action, save state and stop processing current activity
                        await turnState.SaveStateAsync(turnContext, storage);
                        return;
                    }

                    if (response.Status == SignInStatus.Error && response.Cause != AuthExceptionReason.InvalidActivity)
                    {
                        AuthUtilities.DeleteUserInSignInFlow(turnState);
                        throw new TeamsAIException("An error occurred when trying to sign in.", response.Error!);
                    }
                }

                // Call before turn handler
                foreach (TurnEventHandlerAsync<TState> beforeTurnHandler in _beforeTurn)
                {
                    if (!await beforeTurnHandler(turnContext, turnState, cancellationToken))
                    {
                        // Save turn state
                        // - This lets the bot keep track of why it ended the previous turn. It also
                        //   allows the dialog system to be used before the AI system is called.
                        await turnState!.SaveStateAsync(turnContext, storage);

                        return;
                    }
                }

                // Populate {{$temp.input}}
                if ((turnState.Temp.Input == null || turnState.Temp.Input.Length == 0) && turnContext.Activity.Text != null)
                {
                    turnState.Temp.Input = turnContext.Activity.Text;
                }

                bool eventHandlerCalled = false;

                // Run any RouteSelectors in this._invokeRoutes first if the incoming Teams activity.type is "Invoke".
                // Invoke Activities from Teams need to be responded to in less than 5 seconds.
                if (ActivityTypes.Invoke.Equals(turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase))
                {
                    foreach (Route<TState> route in _invokeRoutes)
                    {
                        if (await route.Selector(turnContext, cancellationToken))
                        {
                            await route.Handler(turnContext, turnState, cancellationToken);
                            eventHandlerCalled = true;
                            break;
                        }
                    }
                }

                // All other ActivityTypes and any unhandled Invokes are run through the remaining routes.
                if (!eventHandlerCalled)
                {
                    foreach (Route<TState> route in _routes)
                    {
                        if (await route.Selector(turnContext, cancellationToken))
                        {
                            await route.Handler(turnContext, turnState, cancellationToken);
                            eventHandlerCalled = true;
                            break;
                        }
                    }
                }

                if (!eventHandlerCalled && _ai != null && ActivityTypes.Message.Equals(turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase) && turnContext.Activity.Text != null)
                {
                    // Begin a new chain of AI calls
                    await _ai.RunAsync(turnContext, turnState);
                }

                // Call after turn handler
                foreach (TurnEventHandlerAsync<TState> afterTurnHandler in _afterTurn)
                {
                    if (!await afterTurnHandler(turnContext, turnState, cancellationToken))
                    {
                        return;
                    }
                }
                await turnState!.SaveStateAsync(turnContext, storage);

            }
            finally
            {
                // Stop the timer if configured
                StopTypingTimer();
            }
        }

        /// <summary>
        /// If the user is signed in, get the access token. If not, triggers the sign in flow for the provided authentication setting name
        /// and returns.In this case, the bot should end the turn until the sign in flow is completed.
        /// </summary>
        /// <remarks>
        /// Use this method to get the access token for a user that is signed in to the bot.
        /// If the user isn't signed in, this method starts the sign-in flow.
        /// The bot should end the turn in this case until the sign-in flow completes and the user is signed in.
        /// </remarks>
        /// <param name="turnContext"> The turn context.</param>
        /// <param name="turnState">The turn state.</param>
        /// <param name="settingName">The name of the authentication setting.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>The access token for the user if they are signed, otherwise null.</returns>
        /// <exception cref="TeamsAIException"></exception>
        public async Task<string?> GetTokenOrStartSignInAsync(ITurnContext turnContext, TState turnState, string settingName, CancellationToken cancellationToken = default)
        {
            string? token = await Authentication.Get(settingName).IsUserSignedInAsync(turnContext, cancellationToken);

            if (token != null)
            {
                AuthUtilities.SetTokenInState(turnState, settingName, token);
                AuthUtilities.DeleteUserInSignInFlow(turnState);
                return token;
            }

            // User is currently not in sign in flow
            if (AuthUtilities.UserInSignInFlow(turnState) == null)
            {
                AuthUtilities.SetUserInSignInFlow(turnState, settingName);
            }
            else
            {
                AuthUtilities.DeleteUserInSignInFlow(turnState);
                throw new TeamsAIException("Invalid sign in flow state. Cannot start sign in when already started");
            }

            SignInResponse response = await Authentication.SignUserInAsync(turnContext, turnState, settingName);

            if (response.Status == SignInStatus.Error)
            {
                string message = response.Error!.ToString();
                if (response.Cause == AuthExceptionReason.InvalidActivity)
                {
                    message = $"User is not signed in and cannot start sign in flow for this activity: {response.Error}";
                }

                throw new TeamsAIException($"Error occured while trying to authenticate user: {message}");
            }

            if (response.Status == SignInStatus.Complete)
            {
                AuthUtilities.DeleteUserInSignInFlow(turnState);
                return turnState.Temp.AuthTokens[settingName];
            }

            // response.Status == SignInStatus.Pending
            return null;
        }

        /// <summary>
        /// Convert original handler to proactive conversation.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="handler">The method to call to handle the bot turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        private Task _StartLongRunningCall(ITurnContext turnContext, Func<ITurnContext, CancellationToken, Task> handler, CancellationToken cancellationToken = default)
        {
            if (ActivityTypes.Message.Equals(turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase) && Options.LongRunningMessages)
            {
                return Options.Adapter!.ContinueConversationAsync(Options.BotAppId, turnContext.Activity, (context, ct) => handler(context, ct), cancellationToken);
            }
            else
            {
                return handler(turnContext, cancellationToken);
            }
        }
    }
}
