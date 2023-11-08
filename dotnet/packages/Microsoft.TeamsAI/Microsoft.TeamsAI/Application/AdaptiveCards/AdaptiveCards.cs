using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using System.Text.RegularExpressions;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// AdaptiveCards class to enable fluent style registration of handlers related to Adaptive Cards.
    /// </summary>
    /// <typeparam name="TState">The type of the turn state object used by the application.</typeparam>
    /// <typeparam name="TTurnStateManager">The type of the turn state manager object used by the application.</typeparam>
    public class AdaptiveCards<TState, TTurnStateManager>
        where TState : ITurnState<StateBase, StateBase, TempState>
        where TTurnStateManager : ITurnStateManager<TState>, new()
    {
        private static readonly string ACTION_INVOKE_NAME = "adaptiveCard/action";
        private static readonly string ACTION_EXECUTE_TYPE = "Action.Execute";
        private static readonly string SEARCH_INVOKE_NAME = "application/search";
        private static readonly string DEFAULT_ACTION_SUBMIT_FILTER = "verb";

        private readonly Application<TState, TTurnStateManager> _app;

        /// <summary>
        /// Creates a new instance of the AdaptiveCards class.
        /// </summary>
        /// <param name="app"></param> The top level application class to register handlers with.
        public AdaptiveCards(Application<TState, TTurnStateManager> app)
        {
            this._app = app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="verb">The named action to be handled.</param>
        /// <param name="handler">Function to call when the action is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(string verb, ActionExecuteHandler<TState> handler)
        {
            Verify.ParamNotNull(verb);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateActionExecuteSelector((string input) => string.Equals(verb, input));
            return OnActionExecute(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="verbPattern">Regular expression to match against the named action to be handled.</param>
        /// <param name="handler">Function to call when the action is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(Regex verbPattern, ActionExecuteHandler<TState> handler)
        {
            Verify.ParamNotNull(verbPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateActionExecuteSelector((string input) => verbPattern.IsMatch(input));
            return OnActionExecute(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(RouteSelector routeSelector, ActionExecuteHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                AdaptiveCardInvokeValue? invokeValue;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, ACTION_INVOKE_NAME)
                    || (invokeValue = ActivityUtilities.GetTypedValue<AdaptiveCardInvokeValue>(turnContext.Activity)) == null
                    || invokeValue.Action == null
                    || !string.Equals(invokeValue.Action.Type, ACTION_EXECUTE_TYPE))
                {
                    throw new TeamsAIException($"Unexpected AdaptiveCards.OnActionExecute() triggered for activity type: {turnContext.Activity.Type}");
                }

                AdaptiveCardInvokeResponse adaptiveCardInvokeResponse = await handler(turnContext, turnState, invokeValue.Action.Data, cancellationToken);
                Activity activity = ActivityUtilities.CreateInvokeResponseActivity(adaptiveCardInvokeResponse);
                await turnContext.SendActivityAsync(activity, cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(MultipleRouteSelector routeSelectors, ActionExecuteHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string verb in routeSelectors.Strings)
                {
                    OnActionExecute(verb, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex verbPattern in routeSelectors.Regexes)
                {
                    OnActionExecute(verbPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnActionExecute(routeSelector, handler);
                }
            }
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Submit events.
        /// </summary>
        /// <remarks>
        /// The route will be added for the specified verb(s) and will be filtered using the
        /// `actionSubmitFilter` option. The default filter is to use the `verb` field.
        /// 
        /// For outgoing AdaptiveCards you will need to include the verb's name in the cards Action.Submit.
        /// For example:
        ///
        /// ```JSON
        /// {
        ///   "type": "Action.Submit",
        ///   "title": "OK",
        ///   "data": {
        ///     "verb": "ok"
        ///   }
        /// }
        /// ```
        /// </remarks>
        /// <param name="verb">The named action to be handled.</param>
        /// <param name="handler">Function to call when the action is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionSubmit(string verb, ActionSubmitHandler<TState> handler)
        {
            Verify.ParamNotNull(verb);
            Verify.ParamNotNull(handler);
            string filter = _app.Options.AdaptiveCards?.ActionSubmitFilter ?? DEFAULT_ACTION_SUBMIT_FILTER;
            RouteSelector routeSelector = CreateActionSubmitSelector((string input) => string.Equals(verb, input), filter);
            return OnActionSubmit(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Submit events.
        /// </summary>
        /// <remarks>
        /// The route will be added for the specified verb(s) and will be filtered using the
        /// `actionSubmitFilter` option. The default filter is to use the `verb` field.
        /// 
        /// For outgoing AdaptiveCards you will need to include the verb's name in the cards Action.Submit.
        /// For example:
        ///
        /// ```JSON
        /// {
        ///   "type": "Action.Submit",
        ///   "title": "OK",
        ///   "data": {
        ///     "verb": "ok"
        ///   }
        /// }
        /// ```
        /// </remarks>
        /// <param name="verbPattern">Regular expression to match against the named action to be handled.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionSubmit(Regex verbPattern, ActionSubmitHandler<TState> handler)
        {
            Verify.ParamNotNull(verbPattern);
            Verify.ParamNotNull(handler);
            string filter = _app.Options.AdaptiveCards?.ActionSubmitFilter ?? DEFAULT_ACTION_SUBMIT_FILTER;
            RouteSelector routeSelector = CreateActionSubmitSelector((string input) => verbPattern.IsMatch(input), filter);
            return OnActionSubmit(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Submit events.
        /// </summary>
        /// <remarks>
        /// The route will be added for the specified verb(s) and will be filtered using the
        /// `actionSubmitFilter` option. The default filter is to use the `verb` field.
        /// 
        /// For outgoing AdaptiveCards you will need to include the verb's name in the cards Action.Submit.
        /// For example:
        ///
        /// ```JSON
        /// {
        ///   "type": "Action.Submit",
        ///   "title": "OK",
        ///   "data": {
        ///     "verb": "ok"
        ///   }
        /// }
        /// ```
        /// </remarks>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionSubmit(RouteSelector routeSelector, ActionSubmitHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Message, StringComparison.OrdinalIgnoreCase)
                    || !string.IsNullOrEmpty(turnContext.Activity.Text)
                    || turnContext.Activity.Value == null)
                {
                    throw new TeamsAIException($"Unexpected AdaptiveCards.OnActionSubmit() triggered for activity type: {turnContext.Activity.Type}");
                }

                await handler(turnContext, turnState, turnContext.Activity.Value, cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: false);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Submit events.
        /// </summary>
        /// <remarks>
        /// The route will be added for the specified verb(s) and will be filtered using the
        /// `actionSubmitFilter` option. The default filter is to use the `verb` field.
        /// 
        /// For outgoing AdaptiveCards you will need to include the verb's name in the cards Action.Submit.
        /// For example:
        ///
        /// ```JSON
        /// {
        ///   "type": "Action.Submit",
        ///   "title": "OK",
        ///   "data": {
        ///     "verb": "ok"
        ///   }
        /// }
        /// ```
        /// </remarks>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionSubmit(MultipleRouteSelector routeSelectors, ActionSubmitHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string verb in routeSelectors.Strings)
                {
                    OnActionSubmit(verb, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex verbPattern in routeSelectors.Regexes)
                {
                    OnActionSubmit(verbPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnActionSubmit(routeSelector, handler);
                }
            }
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card dynamic search events.
        /// </summary>
        /// <param name="dataset">The dataset to be searched.</param>
        /// <param name="handler">Function to call when the search is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSearch(string dataset, SearchHandler<TState> handler)
        {
            Verify.ParamNotNull(dataset);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateSearchSelector((string input) => string.Equals(dataset, input));
            return OnSearch(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card dynamic search events.
        /// </summary>
        /// <param name="datasetPattern">Regular expression to match against the dataset to be searched.</param>
        /// <param name="handler">Function to call when the search is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSearch(Regex datasetPattern, SearchHandler<TState> handler)
        {
            Verify.ParamNotNull(datasetPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateSearchSelector((string input) => datasetPattern.IsMatch(input));
            return OnSearch(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card dynamic search events.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSearch(RouteSelector routeSelector, SearchHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                AdaptiveCardSearchInvokeValue? searchInvokeValue;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, SEARCH_INVOKE_NAME)
                    || (searchInvokeValue = ActivityUtilities.GetTypedValue<AdaptiveCardSearchInvokeValue>(turnContext.Activity)) == null)
                {
                    throw new TeamsAIException($"Unexpected AdaptiveCards.OnSearch() triggered for activity type: {turnContext.Activity.Type}");
                }

                AdaptiveCardsSearchParams adaptiveCardsSearchParams = new(searchInvokeValue.QueryText, searchInvokeValue.Dataset ?? string.Empty);
                Query<AdaptiveCardsSearchParams> query = new(searchInvokeValue.QueryOptions.Top, searchInvokeValue.QueryOptions.Skip, adaptiveCardsSearchParams);
                IList<AdaptiveCardsSearchResult> results = await handler(turnContext, turnState, query, cancellationToken);

                // Check to see if an invoke response has already been added
                if (turnContext.TurnState.Get<object>(BotAdapter.InvokeResponseKey) == null)
                {
                    SearchInvokeResponse searchInvokeResponse = new()
                    {
                        StatusCode = 200,
                        Type = "application/vnd.microsoft.search.searchResponse",
                        Value = new AdaptiveCardsSearchInvokeResponseValue
                        {
                            Results = results
                        }
                    };
                    Activity activity = ActivityUtilities.CreateInvokeResponseActivity(searchInvokeResponse);
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: true);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card dynamic search events.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSearch(MultipleRouteSelector routeSelectors, SearchHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);
            if (routeSelectors.Strings != null)
            {
                foreach (string verb in routeSelectors.Strings)
                {
                    OnSearch(verb, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex verbPattern in routeSelectors.Regexes)
                {
                    OnSearch(verbPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnSearch(routeSelector, handler);
                }
            }
            return _app;
        }

        private static RouteSelector CreateActionExecuteSelector(Func<string, bool> isMatch)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                AdaptiveCardInvokeValue? invokeValue;
                return Task.FromResult(
                    string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, ACTION_INVOKE_NAME)
                    && (invokeValue = ActivityUtilities.GetTypedValue<AdaptiveCardInvokeValue>(turnContext.Activity)) != null
                    && invokeValue.Action != null
                    && string.Equals(invokeValue.Action.Type, ACTION_EXECUTE_TYPE)
                    && isMatch(invokeValue.Action.Verb));
            };
            return routeSelector;
        }

        private static RouteSelector CreateActionSubmitSelector(Func<string, bool> isMatch, string filter)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                JObject? obj;
                return Task.FromResult(
                    string.Equals(turnContext.Activity.Type, ActivityTypes.Message, StringComparison.OrdinalIgnoreCase)
                    && string.IsNullOrEmpty(turnContext.Activity.Text)
                    && turnContext.Activity.Value != null
                    && (obj = turnContext.Activity.Value as JObject) != null
                    && obj[filter] != null
                    && obj[filter]!.Type == JTokenType.String
                    && isMatch(obj[filter]!.Value<string>()!));
            };
            return routeSelector;
        }

        private static RouteSelector CreateSearchSelector(Func<string, bool> isMatch)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                AdaptiveCardSearchInvokeValue? searchInvokeValue;
                return Task.FromResult(
                    string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, SEARCH_INVOKE_NAME)
                    && (searchInvokeValue = ActivityUtilities.GetTypedValue<AdaptiveCardSearchInvokeValue>(turnContext.Activity)) != null
                    && isMatch(searchInvokeValue.Dataset!));
            };
            return routeSelector;
        }

        private class AdaptiveCardSearchInvokeValue : SearchInvokeValue
        {
            [JsonProperty("dataset")]
            public string? Dataset { get; set; }
        }

        private class AdaptiveCardsSearchInvokeResponseValue
        {
            [JsonProperty("results")]
            public IList<AdaptiveCardsSearchResult>? Results { get; set; }
        }
    }
}
