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
    /// Constants for message extension invoke names
    /// </summary>
    public class MessageExtensionsInvokeNames
    {
        /// <summary>
        /// Fetch task invoke name
        /// </summary>
        public static readonly string FETCH_TASK_INVOKE_NAME = "composeExtension/fetchTask";
        /// <summary>
        /// Query invoke name
        /// </summary>
        public static readonly string QUERY_INVOKE_NAME = "composeExtension/query";
        /// <summary>
        /// Query link invoke name
        /// </summary>
        public static readonly string QUERY_LINK_INVOKE_NAME = "composeExtension/queryLink";
        /// <summary>
        /// Anonymous query link invoke name
        /// </summary>
        public static readonly string ANONYMOUS_QUERY_LINK_INVOKE_NAME = "composeExtension/anonymousQueryLink";
    }

    /// <summary>
    /// MessageExtensions class to enable fluent style registration of handlers related to Message Extensions.
    /// </summary>
    /// <typeparam name="TState">The type of the turn state object used by the application.</typeparam>
    public class MessageExtensions<TState>
        where TState : TurnState, new()
    {
        private static readonly string SUBMIT_ACTION_INVOKE_NAME = "composeExtension/submitAction";
        private static readonly string SELECT_ITEM_INVOKE_NAME = "composeExtension/selectItem";
        private static readonly string CONFIGURE_SETTINGS = "composeExtension/setting";
        private static readonly string QUERY_SETTING_URL = "composeExtension/querySettingUrl";
        private static readonly string QUERY_CARD_BUTTON_CLICKED = "composeExtension/onCardButtonClicked";

        private readonly Application<TState> _app;

        /// <summary>
        /// Creates a new instance of the MessageExtensions class.
        /// </summary>
        /// <param name="app"></param> The top level application class to register handlers with.
        public MessageExtensions(Application<TState> app)
        {
            this._app = app;
        }

        /// <summary>
        /// Registers a handler that implements the submit action for an Action based Message Extension.
        /// </summary>
        /// <param name="commandId">ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnSubmitAction(string commandId, SubmitActionHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), SUBMIT_ACTION_INVOKE_NAME);
            return OnSubmitAction(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler that implements the submit action for an Action based Message Extension.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnSubmitAction(Regex commandIdPattern, SubmitActionHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), SUBMIT_ACTION_INVOKE_NAME);
            return OnSubmitAction(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler that implements the submit action for an Action based Message Extension.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnSubmitAction(RouteSelectorAsync routeSelector, SubmitActionHandlerAsync<TState> handler)
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
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelectorAsync selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnSubmitAction(MultipleRouteSelector routeSelectors, SubmitActionHandlerAsync<TState> handler)
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
                foreach (RouteSelectorAsync routeSelector in routeSelectors.RouteSelectors)
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
        public Application<TState> OnBotMessagePreviewEdit(string commandId, BotMessagePreviewEditHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), SUBMIT_ACTION_INVOKE_NAME, "edit");
            return OnBotMessagePreviewEdit(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the 'edit' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnBotMessagePreviewEdit(Regex commandIdPattern, BotMessagePreviewEditHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), SUBMIT_ACTION_INVOKE_NAME, "edit");
            return OnBotMessagePreviewEdit(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the 'edit' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnBotMessagePreviewEdit(RouteSelectorAsync routeSelector, BotMessagePreviewEditHandlerAsync<TState> handler)
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
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelectorAsync selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnBotMessagePreviewEdit(MultipleRouteSelector routeSelectors, BotMessagePreviewEditHandlerAsync<TState> handler)
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
                foreach (RouteSelectorAsync routeSelector in routeSelectors.RouteSelectors)
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
        public Application<TState> OnBotMessagePreviewSend(string commandId, BotMessagePreviewSendHandler<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), SUBMIT_ACTION_INVOKE_NAME, "send");
            return OnBotMessagePreviewSend(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the 'send' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnBotMessagePreviewSend(Regex commandIdPattern, BotMessagePreviewSendHandler<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), SUBMIT_ACTION_INVOKE_NAME, "send");
            return OnBotMessagePreviewSend(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the 'send' action of a message that's being previewed by the
        /// user prior to sending.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnBotMessagePreviewSend(RouteSelectorAsync routeSelector, BotMessagePreviewSendHandler<TState> handler)
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
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelectorAsync selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnBotMessagePreviewSend(MultipleRouteSelector routeSelectors, BotMessagePreviewSendHandler<TState> handler)
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
                foreach (RouteSelectorAsync routeSelector in routeSelectors.RouteSelectors)
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
        public Application<TState> OnFetchTask(string commandId, FetchTaskHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), MessageExtensionsInvokeNames.FETCH_TASK_INVOKE_NAME);
            return OnFetchTask(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the initial fetch task for an Action based message extension.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the commands to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnFetchTask(Regex commandIdPattern, FetchTaskHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), MessageExtensionsInvokeNames.FETCH_TASK_INVOKE_NAME);
            return OnFetchTask(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the initial fetch task for an Action based message extension.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnFetchTask(RouteSelectorAsync routeSelector, FetchTaskHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, MessageExtensionsInvokeNames.FETCH_TASK_INVOKE_NAME))
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
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelectorAsync selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnFetchTask(MultipleRouteSelector routeSelectors, FetchTaskHandlerAsync<TState> handler)
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
                foreach (RouteSelectorAsync routeSelector in routeSelectors.RouteSelectors)
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
        public Application<TState> OnQuery(string commandId, QueryHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(commandId);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => string.Equals(commandId, input), MessageExtensionsInvokeNames.QUERY_INVOKE_NAME);
            return OnQuery(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler that implements a Search based Message Extension.
        /// </summary>
        /// <param name="commandIdPattern">Regular expression to match against the ID of the command to register the handler for.</param>
        /// <param name="handler">Function to call when the command is received.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnQuery(Regex commandIdPattern, QueryHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(commandIdPattern);
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = CreateTaskSelector((string input) => commandIdPattern.IsMatch(input), MessageExtensionsInvokeNames.QUERY_INVOKE_NAME);
            return OnQuery(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler that implements a Search based Message Extension.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnQuery(RouteSelectorAsync routeSelector, QueryHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                MessagingExtensionQuery? messagingExtensionQuery;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, MessageExtensionsInvokeNames.QUERY_INVOKE_NAME)
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
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelectorAsync selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnQuery(MultipleRouteSelector routeSelectors, QueryHandlerAsync<TState> handler)
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
                foreach (RouteSelectorAsync routeSelector in routeSelectors.RouteSelectors)
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
        public Application<TState> OnSelectItem(SelectItemHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
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
        public Application<TState> OnQueryLink(QueryLinkHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, MessageExtensionsInvokeNames.QUERY_LINK_INVOKE_NAME));
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
        public Application<TState> OnAnonymousQueryLink(QueryLinkHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, MessageExtensionsInvokeNames.ANONYMOUS_QUERY_LINK_INVOKE_NAME));
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
        public Application<TState> OnQueryUrlSetting(QueryUrlSettingHandlerAsync<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
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
        public Application<TState> OnConfigureSettings(ConfigureSettingsHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
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
        public Application<TState> OnCardButtonClicked(CardButtonClickedHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
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

        private static RouteSelectorAsync CreateTaskSelector(Func<string, bool> isMatch, string invokeName, string? botMessagePreviewAction = default)
        {
            RouteSelectorAsync routeSelector = (turnContext, cancellationToken) =>
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
