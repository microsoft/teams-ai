using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.AI;
using Microsoft.TeamsAI.State;
using Microsoft.TeamsAI.Utilities;
using Newtonsoft.Json.Linq;
using System.Collections.Concurrent;
using System.Net;

namespace Microsoft.TeamsAI.Application
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
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <typeparam name="TTurnStateManager">Type of the turn state manager.</typeparam>
    public class Application<TState, TTurnStateManager> : IBot
        where TState : ITurnState<StateBase, StateBase, TempState>
        where TTurnStateManager : ITurnStateManager<TState>, new()
    {
        private readonly AI<TState>? _ai;
        private readonly int _typingTimerDelay = 1000;
        private TypingTimer? _typingTimer;

        private readonly ConcurrentQueue<Route<TState>> _invokeRoutes;
        private readonly ConcurrentQueue<Route<TState>> _routes;

        /// <summary>
        /// Creates a new Application instance.
        /// </summary>
        /// <param name="options">Optional. Options used to configure the application.</param>
        public Application(ApplicationOptions<TState, TTurnStateManager> options)
        {
            Verify.ParamNotNull(options);

            Options = options;

            Options.TurnStateManager ??= new TTurnStateManager();

            if (Options.AI != null)
            {
                _ai = new AI<TState>(Options.AI, Options.LoggerFactory);
            }

            // Validate long running messages configuration
            if (Options.LongRunningMessages && (Options.Adapter == null || Options.BotAppId == null))
            {
                throw new ArgumentException("The ApplicationOptions.LongRunningMessages property is unavailable because no adapter or botAppId was configured.");
            }

            _routes = new ConcurrentQueue<Route<TState>>();
            _invokeRoutes = new ConcurrentQueue<Route<TState>>();
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
        /// The application's configured options.
        /// </summary>
        public ApplicationOptions<TState, TTurnStateManager> Options { get; }

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
        /// <param name="selector">Function that's used to select a route. The function should return true to trigger the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <param name="isInvokeRoute">Boolean indicating if the RouteSelector is for an activity that uses "invoke" which require special handling. Defaults to `false`.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> AddRoute(RouteSelector selector, RouteHandler<TState> handler, bool isInvokeRoute = false)
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

                ITurnStateManager<TState>? turnStateManager = Options.TurnStateManager;
                IStorage? storage = Options.Storage;

                TState turnState = await turnStateManager!.LoadStateAsync(storage, turnContext);

                // TODO: Call before activity handler

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
                    await _ai.ChainAsync(turnContext, turnState);
                }

                // TODO: Call after turn activity handler
            }
            finally
            {
                // Stop the timer if configured
                StopTypingTimer();
            }
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

        internal static T? GetInvokeValue<T>(IInvokeActivity activity)
        {
            if (activity.Value == null)
            {
                return default;
            }

            JObject? obj = activity.Value as JObject;
            if (obj == null)
            {
                return default;
            }

            T? invokeValue;

            try
            {
                invokeValue = obj.ToObject<T>();
            }
            catch
            {
                return default;
            }

            return invokeValue;
        }

        internal static Activity CreateInvokeResponseActivity(object body)
        {
            Activity activity = new()
            {
                Type = ActivityTypesEx.InvokeResponse,
                Value = new InvokeResponse { Status = (int)HttpStatusCode.OK, Body = body }
            };
            return activity;
        }
    }
}
