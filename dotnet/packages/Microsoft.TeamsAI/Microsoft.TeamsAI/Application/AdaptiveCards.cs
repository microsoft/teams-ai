﻿using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.Exceptions;
using Microsoft.TeamsAI.State;
using Microsoft.TeamsAI.Utilities;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using System.Net;
using System.Text.RegularExpressions;

namespace Microsoft.TeamsAI.Application
{
    /// <summary>
    /// Parameters passed to AdaptiveCards.OnSearch() handler.
    /// </summary>
    public class AdaptiveCardsSearchParams
    {
        /// <summary>
        /// The query text.
        /// </summary>
        public string QueryText { get; set; }

        /// <summary>
        /// The dataset to search.
        /// </summary>
        public string Dataset { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="AdaptiveCardsSearchParams"/> class.
        /// </summary>
        /// <param name="queryText">The query text.</param>
        /// <param name="dataset">The dataset to search.</param>
        public AdaptiveCardsSearchParams(string queryText, string dataset)
        {
            this.QueryText = queryText;
            this.Dataset = dataset;
        }
    }

    /// <summary>
    /// Individual result returned from AdaptiveCards.OnSearch() handler.
    /// </summary>
    public class AdaptiveCardsSearchResult
    {
        /// <summary>
        /// The title of the result.
        /// </summary>
        [JsonProperty("title")]
        public string Title { get; set; }

        /// <summary>
        /// The subtitle of the result.
        /// </summary>
        [JsonProperty("value")]
        public string Value { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="AdaptiveCardsSearchResult"/> class.
        /// </summary>
        /// <param name="title">The title of the result.</param>
        /// <param name="value">The subtitle of the result.</param>
        public AdaptiveCardsSearchResult(string title, string value)
        {
            this.Title = title;
            this.Value = value;
        }
    }

    /// <summary>
    /// Function for handling Adaptive Card Action.Execute events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="data">The data associated with the action.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task<AdaptiveCard> ActionExecuteAdaptiveCardHandler<TState>(ITurnContext turnContext, TState turnState, object data, CancellationToken cancellationToken);

    /// <summary>
    /// Function for handling Adaptive Card Action.Execute events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="data">The data associated with the action.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task<string> ActionExecuteTextHandler<TState>(ITurnContext turnContext, TState turnState, object data, CancellationToken cancellationToken);

    /// <summary>
    /// Function for handling Adaptive Card Action.Submit events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="data">The data associated with the action.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task ActionSubmitHandler<TState>(ITurnContext turnContext, TState turnState, object data, CancellationToken cancellationToken);

    /// <summary>
    /// Function for handling Adaptive Card dynamic search events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="query">The query arguments.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task<IList<AdaptiveCardsSearchResult>> SearchHandler<TState>(ITurnContext turnContext, TState turnState, Query<AdaptiveCardsSearchParams> query, CancellationToken cancellationToken);

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
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(string verb, ActionExecuteAdaptiveCardHandler<TState> handler)
        {
            Verify.ParamNotNull(verb);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateActionExecuteSelector((string input) => string.Equals(verb, input));
            return OnActionExecute(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="verbPattern">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(Regex verbPattern, ActionExecuteAdaptiveCardHandler<TState> handler)
        {
            Verify.ParamNotNull(verbPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateActionExecuteSelector((string input) => verbPattern.IsMatch(input));
            return OnActionExecute(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="routeSelector">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(RouteSelector routeSelector, ActionExecuteAdaptiveCardHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                AdaptiveCardInvokeValue? invokeValue;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, ACTION_INVOKE_NAME)
                    || (invokeValue = GetInvokeValue<AdaptiveCardInvokeValue>(turnContext.Activity)) == null
                    || invokeValue.Action == null
                    || !string.Equals(invokeValue.Action.Type, ACTION_EXECUTE_TYPE))
                {
                    throw new TeamsAIException($"Unexpected AdaptiveCards.OnActionExecute() triggered for activity type: {turnContext.Activity.Type}");
                }

                AdaptiveCard adaptiveCard = await handler(turnContext, turnState, invokeValue.Action.Data, cancellationToken);
                AdaptiveCardInvokeResponse adaptiveCardInvokeResponse = new()
                {
                    StatusCode = 200,
                    Type = "application/vnd.microsoft.card.adaptive",
                    Value = adaptiveCard
                };
                InvokeResponse invokeResponse = CreateInvokeResponse(adaptiveCardInvokeResponse);
                Activity activity = new()
                {
                    Type = ActivityTypesEx.InvokeResponse,
                    Value = invokeResponse
                };
                await turnContext.SendActivityAsync(activity, cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, true);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="routeSelectors">The named actions to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(MultipleRouteSelector routeSelectors, ActionExecuteAdaptiveCardHandler<TState> handler)
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
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="verb">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(string verb, ActionExecuteTextHandler<TState> handler)
        {
            Verify.ParamNotNull(verb);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateActionExecuteSelector((string input) => string.Equals(verb, input));
            return OnActionExecute(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="verbPattern">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(Regex verbPattern, ActionExecuteTextHandler<TState> handler)
        {
            Verify.ParamNotNull(verbPattern);
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = CreateActionExecuteSelector((string input) => verbPattern.IsMatch(input));
            return OnActionExecute(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="routeSelector">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(RouteSelector routeSelector, ActionExecuteTextHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                AdaptiveCardInvokeValue? invokeValue;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, ACTION_INVOKE_NAME)
                    || (invokeValue = GetInvokeValue<AdaptiveCardInvokeValue>(turnContext.Activity)) == null
                    || invokeValue.Action == null
                    || !string.Equals(invokeValue.Action.Type, ACTION_EXECUTE_TYPE))
                {
                    throw new TeamsAIException($"Unexpected AdaptiveCards.OnActionExecute() triggered for activity type: {turnContext.Activity.Type}");
                }

                string result = await handler(turnContext, turnState, invokeValue.Action.Data, cancellationToken);
                AdaptiveCardInvokeResponse adaptiveCardInvokeResponse = new()
                {
                    StatusCode = 200,
                    Type = "application/vnd.microsoft.activity.message",
                    Value = result
                };
                InvokeResponse invokeResponse = CreateInvokeResponse(adaptiveCardInvokeResponse);
                Activity activity = new()
                {
                    Type = ActivityTypesEx.InvokeResponse,
                    Value = invokeResponse
                };
                await turnContext.SendActivityAsync(activity, cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, true);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <param name="routeSelectors">The named actions to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute(MultipleRouteSelector routeSelectors, ActionExecuteTextHandler<TState> handler)
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
        /// <param name="verb">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
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
        /// <param name="verbPattern">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
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
        /// <param name="routeSelector">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
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
            _app.AddRoute(routeSelector, routeHandler);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Submit events.
        /// </summary>
        /// <param name="routeSelectors">The named actions to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
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
        /// <param name="dataset">The dataset to be handled.</param>
        /// <param name="handler">The code to execute when the search is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
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
        /// <param name="datasetPattern">The dataset to be handled.</param>
        /// <param name="handler">The code to execute when the search is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
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
        /// <param name="routeSelector">The dataset to be handled.</param>
        /// <param name="handler">The code to execute when the search is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSearch(RouteSelector routeSelector, SearchHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                AdaptiveCardSearchInvokeValue? searchInvokeValue;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, SEARCH_INVOKE_NAME)
                    || (searchInvokeValue = GetInvokeValue<AdaptiveCardSearchInvokeValue>(turnContext.Activity)) == null)
                {
                    throw new TeamsAIException($"Unexpected AdaptiveCards.OnSearch() triggered for activity type: {turnContext.Activity.Type}");
                }

                AdaptiveCardsSearchParams adaptiveCardsSearchParams = new(searchInvokeValue.QueryText, searchInvokeValue.Dataset);
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
                    InvokeResponse invokeResponse = CreateInvokeResponse(searchInvokeResponse);
                    Activity activity = new()
                    {
                        Type = ActivityTypesEx.InvokeResponse,
                        Value = invokeResponse
                    };
                    await turnContext.SendActivityAsync(activity, cancellationToken);
                }
            };
            _app.AddRoute(routeSelector, routeHandler, true);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card dynamic search events.
        /// </summary>
        /// <param name="routeSelectors">The datasets to be handled.</param>
        /// <param name="handler">The code to execute when the search is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
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

        private RouteSelector CreateActionExecuteSelector(Func<string, bool> isMatch)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                bool isAction = string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, ACTION_INVOKE_NAME);
                if (!isAction)
                {
                    return Task.FromResult(false);
                }
                AdaptiveCardInvokeValue? invokeValue = GetInvokeValue<AdaptiveCardInvokeValue>(turnContext.Activity);
                return Task.FromResult(invokeValue != null && isMatch(invokeValue.Action.Verb));
            };
            return routeSelector;
        }

        private RouteSelector CreateActionSubmitSelector(Func<string, bool> isMatch, string filter)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                bool isSubmit = string.Equals(turnContext.Activity.Type, ActivityTypes.Message, StringComparison.OrdinalIgnoreCase)
                    && string.IsNullOrEmpty(turnContext.Activity.Text)
                    && turnContext.Activity.Value != null;
                if (!isSubmit)
                {
                    return Task.FromResult(false);
                }
                JObject? data = turnContext.Activity.Value as JObject;
                return Task.FromResult(data != null && data[filter] != null && data[filter]!.Type == JTokenType.String && isMatch(data[filter]!.Value<string>()!));
            };
            return routeSelector;
        }

        private RouteSelector CreateSearchSelector(Func<string, bool> isMatch)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                bool isSearch = string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(turnContext.Activity.Name, SEARCH_INVOKE_NAME);
                if (!isSearch)
                {
                    return Task.FromResult(false);
                }
                AdaptiveCardSearchInvokeValue? searchInvokeValue = GetInvokeValue<AdaptiveCardSearchInvokeValue>(turnContext.Activity);
                return Task.FromResult(searchInvokeValue != null && isMatch(searchInvokeValue.Dataset));
            };
            return routeSelector;
        }

        private static InvokeResponse CreateInvokeResponse(object? body)
        {
            return new InvokeResponse { Status = (int)HttpStatusCode.OK, Body = body };
        }

        private static T? GetInvokeValue<T>(IInvokeActivity activity)
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

        private class AdaptiveCardSearchInvokeValue : SearchInvokeValue
        {
            [JsonProperty("dataset")]
            public string Dataset { get; set; }
        }

        private class AdaptiveCardsSearchInvokeResponseValue
        {
            [JsonProperty("results")]
            public IList<AdaptiveCardsSearchResult>? Results { get; set; }
        }
    }
}
