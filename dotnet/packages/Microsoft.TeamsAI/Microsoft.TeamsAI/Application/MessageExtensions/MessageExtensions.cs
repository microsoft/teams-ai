using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Newtonsoft.Json.Linq;
using System.Text.RegularExpressions;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// MessageExtensions class to enable fluent style registration of handlers related to Message Extensions.
    /// </summary>
    /// <typeparam name="TState">The type of the turn state object used by the application.</typeparam>
    /// <typeparam name="TTurnStateManager">The type of the turn state manager object used by the application.</typeparam>
    public class MessageExtensions<TState, TTurnStateManager>
        where TState : ITurnState<StateBase, StateBase, TempState>
        where TTurnStateManager : ITurnStateManager<TState>, new()
    {
        private static readonly string SUBMIT_ACTION_INVOKE_NAME = "composeExtension/submitAction";
        private static readonly string FETCH_TASK_INVOKE_NAME = "composeExtension/fetchTask";
        private static readonly string QUERY_INVOKE_NAME = "composeExtension/query";
        private static readonly string SELECT_ITEM_INVOKE_NAME = "composeExtension/selectItem";
        private static readonly string QUERY_LINK_INVOKE_NAME = "composeExtension/queryLink";
        private static readonly string ANONYMOUS_QUERY_LINK_INVOKE_NAME = "composeExtension/anonymousQueryLink";
        private static readonly string CONFIGURE_SETTINGS = "composeExtension/setting";
        private static readonly string QUERY_SETTING_URL = "composeExtension/querySettingUrl";
        private static readonly string QUERY_CARD_BUTTON_CLICKED = "composeExtension/onCardButtonClicked";

        private readonly Application<TState, TTurnStateManager> _app;

        /// <summary>
        /// Creates a new instance of the MessageExtensions class.
        /// </summary>
        /// <param name="app"></param> The top level application class to register handlers with.
        public MessageExtensions(Application<TState, TTurnStateManager> app)
        {
            this._app = app;
        }

        /// <summary>
        /// Registers a handler that implements the submit action for an Action based Message Extension.
        /// </summary>
        /// <param name="commandId">ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSubmitAction(string commandId, SubmitActionHandler<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), SUBMIT_ACTION_INVOKE_NAME);
            return OnSubmitAction(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler that implements the submit action for an Action based Message Extension.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSubmitAction(Regex commandIdPattern, SubmitActionHandler<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), SUBMIT_ACTION_INVOKE_NAME);
            return OnSubmitAction(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler that implements the submit action for an Action based Message Extension.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSubmitAction(RouteSelector routeSelector, SubmitActionHandler<TState> handler)
        {
            MessagingExtensionAction? messagingExtensionAction;
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, SUBMIT_ACTION_INVOKE_NAME)
                    || (messagingExtensionAction = ActivityUtilities.GetTypedValue<MessagingExtensionAction>(turnContext.Activity)) == null)
                {
                    throw new TeamsAIException($"Unexpected MessageExtensions.OnSubmitAction() triggered for activity type: {turnContext.Activity.Type}");
                }

                MessagingExtensionActionResponse result = await handler(turnContext, turnState, messagingExtensionAction.Data, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(result);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler that implements the submit action for an Action based Message Extension.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSubmitAction(MultipleRouteSelector routeSelectors, SubmitActionHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string commandId in routeSelectors.Strings)
                {
                    OnSubmitAction(commandId, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex commandIdPattern in routeSelectors.Regexes)
                {
                    OnSubmitAction(commandIdPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnSubmitAction(routeSelector, handler);
                }
            }
            return _app;
        }

        /// <summary>
        /// Registers a handler to process the 'edit' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="commandId">ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnBotMessagePreviewEdit(string commandId, BotMessagePreviewEditHandler<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), SUBMIT_ACTION_INVOKE_NAME, "edit");
            return OnBotMessagePreviewEdit(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the 'edit' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnBotMessagePreviewEdit(Regex commandIdPattern, BotMessagePreviewEditHandler<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), SUBMIT_ACTION_INVOKE_NAME, "edit");
            return OnBotMessagePreviewEdit(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the 'edit' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnBotMessagePreviewEdit(RouteSelector routeSelector, BotMessagePreviewEditHandler<TState> handler)
        {
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                MessagingExtensionAction? messagingExtensionAction;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, SUBMIT_ACTION_INVOKE_NAME)
                    || (messagingExtensionAction = ActivityUtilities.GetTypedValue<MessagingExtensionAction>(turnContext.Activity)) == null
                    || !string.Equals(messagingExtensionAction.BotMessagePreviewAction, "edit"))
                {
                    throw new TeamsAIException($"Unexpected MessageExtensions.OnBotMessagePreviewEdit() triggered for activity type: {turnContext.Activity.Type}");
                }

                MessagingExtensionActionResponse result = await handler(turnContext, turnState, messagingExtensionAction.BotActivityPreview[0], cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(result);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler to process the 'edit' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnBotMessagePreviewEdit(MultipleRouteSelector routeSelectors, BotMessagePreviewEditHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string commandId in routeSelectors.Strings)
                {
                    OnBotMessagePreviewEdit(commandId, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex commandIdPattern in routeSelectors.Regexes)
                {
                    OnBotMessagePreviewEdit(commandIdPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnBotMessagePreviewEdit(routeSelector, handler);
                }
            }
            return _app;
        }

        /// <summary>
        /// Registers a handler to process the 'send' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="commandId">ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnBotMessagePreviewSend(string commandId, BotMessagePreviewSendHandler<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), SUBMIT_ACTION_INVOKE_NAME, "send");
            return OnBotMessagePreviewSend(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the 'send' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnBotMessagePreviewSend(Regex commandIdPattern, BotMessagePreviewSendHandler<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), SUBMIT_ACTION_INVOKE_NAME, "send");
            return OnBotMessagePreviewSend(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the 'send' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnBotMessagePreviewSend(RouteSelector routeSelector, BotMessagePreviewSendHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                MessagingExtensionAction? messagingExtensionAction;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, SUBMIT_ACTION_INVOKE_NAME)
                    || (messagingExtensionAction = ActivityUtilities.GetTypedValue<MessagingExtensionAction>(turnContext.Activity)) == null
                    || !string.Equals(messagingExtensionAction.BotMessagePreviewAction, "send"))
                {
                    throw new TeamsAIException($"Unexpected MessageExtensions.OnBotMessagePreviewSend() triggered for activity type: {turnContext.Activity.Type}");
                }

                Activity activityPreview = messagingExtensionAction.BotActivityPreview.Count > 0 ? messagingExtensionAction.BotActivityPreview[0] : new Activity();
                await handler(turnContext, turnState, activityPreview, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    MessagingExtensionActionResponse response = new();
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(response);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler to process the 'send' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnBotMessagePreviewSend(MultipleRouteSelector routeSelectors, BotMessagePreviewSendHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string commandId in routeSelectors.Strings)
                {
                    OnBotMessagePreviewSend(commandId, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex commandIdPattern in routeSelectors.Regexes)
                {
                    OnBotMessagePreviewSend(commandIdPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnBotMessagePreviewSend(routeSelector, handler);
                }
            }
            return _app;
        }

        /// <summary>
        /// Registers a handler to process the initial fetch task for an Action based message extension.
        /// </summary>
        /// <param name="commandId">ID of the commands to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnFetchTask(string commandId, FetchTaskHandler<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), FETCH_TASK_INVOKE_NAME);
            return OnFetchTask(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the initial fetch task for an Action based message extension.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the commands to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnFetchTask(Regex commandIdPattern, FetchTaskHandler<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), FETCH_TASK_INVOKE_NAME);
            return OnFetchTask(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the initial fetch task for an Action based message extension.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnFetchTask(RouteSelector routeSelector, FetchTaskHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, FETCH_TASK_INVOKE_NAME))
                {
                    throw new TeamsAIException($"Unexpected MessageExtensions.OnFetchTask() triggered for activity type: {turnContext.Activity.Type}");
                }

                TaskModuleResponse result = await handler(turnContext, turnState, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(result);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler to process the initial fetch task for an Action based message extension.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnFetchTask(MultipleRouteSelector routeSelectors, FetchTaskHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string commandId in routeSelectors.Strings)
                {
                    OnFetchTask(commandId, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex commandIdPattern in routeSelectors.Regexes)
                {
                    OnFetchTask(commandIdPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnFetchTask(routeSelector, handler);
                }
            }
            return _app;
        }

        /// <summary>
        /// Registers a handler that implements a Search based Message Extension.
        /// </summary>
        /// <param name="commandId">ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnQuery(string commandId, QueryHandler<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), QUERY_INVOKE_NAME);
            return OnQuery(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler that implements a Search based Message Extension.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnQuery(Regex commandIdPattern, QueryHandler<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), QUERY_INVOKE_NAME);
            return OnQuery(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler that implements a Search based Message Extension.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnQuery(RouteSelector routeSelector, QueryHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                MessagingExtensionQuery? messagingExtensionQuery;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, QUERY_INVOKE_NAME)
                    || (messagingExtensionQuery = ActivityUtilities.GetTypedValue<MessagingExtensionQuery>(turnContext.Activity)) == null)
                {
                    throw new TeamsAIException($"Unexpected MessageExtensions.OnQuery() triggered for activity type: {turnContext.Activity.Type}");
                }

                Dictionary<string, object> parameters = new();
                foreach (MessagingExtensionParameter parameter in messagingExtensionQuery.Parameters)
                {
                    parameters.Add(parameter.Name, parameter.Value);
                }
                Query<Dictionary<string, object>> query = new(messagingExtensionQuery.QueryOptions.Count ?? 25, messagingExtensionQuery.QueryOptions.Skip ?? 0, parameters);
                MessagingExtensionResult result = await handler(turnContext, turnState, query, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    MessagingExtensionActionResponse response = new()
                    {
                        ComposeExtension = result
                    };
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(response);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler that implements a Search based Message Extension.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnQuery(MultipleRouteSelector routeSelectors, QueryHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string commandId in routeSelectors.Strings)
                {
                    OnQuery(commandId, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex commandIdPattern in routeSelectors.Regexes)
                {
                    OnQuery(commandIdPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnQuery(routeSelector, handler);
                }
            }
            return _app;
        }

        /// <summary>
        /// Registers a handler that implements the logic to handle the tap actions for items returned
        /// by a Search based message extension.
        /// <remarks>
        /// The `composeExtension/selectItem` INVOKE activity does not contain any sort of command ID,
        /// so only a single select item handler can be registered. Developers will need to include a
        /// type name of some sort in the preview item they return if they need to support multiple
        /// select item handlers.
        /// </remarks>>
        /// </summary>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSelectItem(SelectItemHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, SELECT_ITEM_INVOKE_NAME));
            };
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                MessagingExtensionResult result = await handler(turnContext, turnState, turnContext.Activity.Value, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    MessagingExtensionActionResponse response = new()
                    {
                        ComposeExtension = result
                    };
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(response);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler that implements a Link Unfurling based Message Extension.
        /// </summary>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnQueryLink(QueryLinkHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, QUERY_LINK_INVOKE_NAME));
            };
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                AppBasedLinkQuery? appBasedLinkQuery = ActivityUtilities.GetTypedValue<AppBasedLinkQuery>(turnContext.Activity);
                MessagingExtensionResult result = await handler(turnContext, turnState, appBasedLinkQuery!.Url, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    MessagingExtensionActionResponse response = new()
                    {
                        ComposeExtension = result
                    };
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(response);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler that implements the logic to handle anonymous link unfurling.
        /// </summary>
        /// <remarks>
        /// The `composeExtension/anonymousQueryLink` INVOKE activity does not contain any sort of command ID,
        /// so only a single select item handler can be registered.
        /// For more information visit https://learn.microsoft.com/microsoftteams/platform/messaging-extensions/how-to/link-unfurling?#enable-zero-install-link-unfurling
        /// </remarks>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnAnonymousQueryLink(QueryLinkHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, ANONYMOUS_QUERY_LINK_INVOKE_NAME));
            };
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                AppBasedLinkQuery? appBasedLinkQuery = ActivityUtilities.GetTypedValue<AppBasedLinkQuery>(turnContext.Activity);
                MessagingExtensionResult result = await handler(turnContext, turnState, appBasedLinkQuery!.Url, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    MessagingExtensionActionResponse response = new()
                    {
                        ComposeExtension = result
                    };
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(response);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler that invokes the fetch of the configuration settings for a Message Extension.
        /// </summary>
        /// <remarks>
        /// The `composeExtension/querySettingUrl` INVOKE activity does not contain a command ID, so only a single select item handler can be registered.
        /// </remarks>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnQueryUrlSetting(QueryUrlSettingHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, QUERY_SETTING_URL));
            };
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                MessagingExtensionResult result = await handler(turnContext, turnState, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    MessagingExtensionActionResponse response = new()
                    {
                        ComposeExtension = result
                    };
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(response);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler that implements the logic to invoke configuring Message Extension settings.
        /// </summary>
        /// <remarks>
        /// The `composeExtension/setting` INVOKE activity does not contain a command ID, so only a single select item handler can be registered.
        /// </remarks>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnConfigureSettings(ConfigureSettingsHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, CONFIGURE_SETTINGS));
            };
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                await handler(turnContext, turnState, turnContext.Activity.Value, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity();
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Registers a handler that implements the logic when a user has clicked on a button in a Message Extension card.
        /// </summary>
        /// <remarks>
        /// The `composeExtension/onCardButtonClicked` INVOKE activity does not contain any sort of command ID,
        /// so only a single select item handler can be registered. Developers will need to include a
        /// type name of some sort in the preview item they return if they need to support multiple select item handlers.
        /// </remarks>
        /// <param name="handler">Function to call when the event is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnCardButtonClicked(CardButtonClickedHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, QUERY_CARD_BUTTON_CLICKED));
            };
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                await handler(turnContext, turnState, turnContext.Activity.Value, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity();
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        private static RouteSelector CreateTaskSelector(Func<string, bool> isMatch, string invokeName, string? botMessagePreviewAction = default)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                bool isInvoke = string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, invokeName);
                if (!isInvoke)
                {
                    return Task.FromResult(false);
                }
                JObject? obj = turnContext.Activity.Value as JObject;
                if (obj == null)
                {
                    return Task.FromResult(false);
                }
                bool isCommandMatch = obj.TryGetValue("commandId", out JToken? commandId) && commandId != null && commandId.Type == JTokenType.String && isMatch(commandId.Value<string>()!);
                JToken? previewActionToken = obj.GetValue("botMessagePreviewAction");
                bool isPreviewActionMatch = string.IsNullOrEmpty(botMessagePreviewAction)
                    ? previewActionToken == null || string.IsNullOrEmpty(previewActionToken.Value<string>())
                    : previewActionToken != null && string.Equals(botMessagePreviewAction, previewActionToken.Value<string>());
                return Task.FromResult(isCommandMatch && isPreviewActionMatch);
            };
            return routeSelector;
        }
    }
}
