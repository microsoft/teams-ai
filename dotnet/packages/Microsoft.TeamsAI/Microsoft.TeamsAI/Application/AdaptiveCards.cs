using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.Exceptions;
using Microsoft.TeamsAI.State;
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
    /// <typeparam name="TData">Type of the data associated with the action. This allows for strongly typed access to the action data.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="data">A strongly-typed data associated with the action.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task<AdaptiveCard> ActionExecuteAdaptiveCardHandler<TState, TData>(ITurnContext turnContext, TState turnState, TData data, CancellationToken cancellationToken);

    /// <summary>
    /// Function for handling Adaptive Card Action.Execute events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <typeparam name="TData">Type of the data associated with the action. This allows for strongly typed access to the action data.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="data">A strongly-typed data associated with the action.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task<string> ActionExecuteTextHandler<TState, TData>(ITurnContext turnContext, TState turnState, TData data, CancellationToken cancellationToken);


    /// <summary>
    /// Function for handling Adaptive Card Action.Submit events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <typeparam name="TData">Type of the data associated with the action. This allows for strongly typed access to the action data.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="data">A strongly-typed data associated with the action.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task ActionSubmitHandler<TState, TData>(ITurnContext turnContext, TState turnState, TData data, CancellationToken cancellationToken);

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
    /// Options for AdaptiveCards class.
    /// </summary>
    public class AdaptiveCardsOptions
    {
        /// <summary>
        /// Data field used to identify the Action.Submit handler to trigger.
        /// </summary>
        /// <remarks>
        /// When an Action.Submit is triggered, the field name specified here will be used to determine
        /// the handler to route the request to.
        /// Defaults to a value of "verb".
        /// </remarks>
        public string? ActionSubmitFilter { get; set; }
    }

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
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="verb">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute<TData>(string verb, ActionExecuteAdaptiveCardHandler<TState, TData> handler)
        {
            return OnActionExecute(new Regex($"^{verb}$"), handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="verbPattern">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute<TData>(Regex verbPattern, ActionExecuteAdaptiveCardHandler<TState, TData> handler)
        {
            RouteSelector routeSelector = CreateActionExecuteSelector(verbPattern);
            return OnActionExecute(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="routeSelector">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute<TData>(RouteSelector routeSelector, ActionExecuteAdaptiveCardHandler<TState, TData> handler)
        {
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                AdaptiveCardInvokeValue invokeValue = GetAdaptiveCardInvokeValue(turnContext.Activity);
                AdaptiveCard adaptiveCard = await handler(turnContext, turnState, SafeCast<TData>(invokeValue.Action.Data), cancellationToken);
                Attachment attachment = new()
                {
                    ContentType = "application/vnd.microsoft.card.adaptive",
                    Content = adaptiveCard
                };
                await turnContext.SendActivityAsync(MessageFactory.Attachment(attachment), cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, true);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="routeSelectors">The named actions to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute<TData>(MultipleRouteSelector routeSelectors, ActionExecuteAdaptiveCardHandler<TState, TData> handler)
        {
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
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="verb">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute<TData>(string verb, ActionExecuteTextHandler<TState, TData> handler)
        {
            return OnActionExecute(new Regex($"^{verb}$"), handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="verbPattern">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute<TData>(Regex verbPattern, ActionExecuteTextHandler<TState, TData> handler)
        {
            RouteSelector routeSelector = CreateActionExecuteSelector(verbPattern);
            return OnActionExecute(routeSelector, handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="routeSelector">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute<TData>(RouteSelector routeSelector, ActionExecuteTextHandler<TState, TData> handler)
        {
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                AdaptiveCardInvokeValue invokeValue = GetAdaptiveCardInvokeValue(turnContext.Activity);
                string result = await handler(turnContext, turnState, SafeCast<TData>(invokeValue.Action.Data), cancellationToken);
                await turnContext.SendActivityAsync(MessageFactory.Text(result), cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, true);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Execute events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="routeSelectors">The named actions to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionExecute<TData>(MultipleRouteSelector routeSelectors, ActionExecuteTextHandler<TState, TData> handler)
        {
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
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="verb">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionSubmit<TData>(string verb, ActionSubmitHandler<TState, TData> handler)
        {
            return OnActionSubmit(new Regex($"^{verb}$"), handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Submit events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="verbPattern">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionSubmit<TData>(Regex verbPattern, ActionSubmitHandler<TState, TData> handler)
        {
            // TODO: use _app.Options.AdaptiveCards.ActionSubmitFilter
            string filter = DEFAULT_ACTION_SUBMIT_FILTER;
            RouteSelector routeSelector = CreateActionSubmitSelector(verbPattern, filter);
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                await handler(turnContext, turnState, SafeCast<TData>(turnContext.Activity.Value), cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Submit events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="routeSelector">The named action to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionSubmit<TData>(RouteSelector routeSelector, ActionSubmitHandler<TState, TData> handler)
        {
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                await handler(turnContext, turnState, SafeCast<TData>(turnContext.Activity.Value), cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler);
            return _app;
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card Action.Submit events.
        /// </summary>
        /// <typeparam name="TData">Type of the data associated with the action.</typeparam>
        /// <param name="routeSelectors">The named actions to be handled.</param>
        /// <param name="handler">The code to execute when the action is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnActionSubmit<TData>(MultipleRouteSelector routeSelectors, ActionSubmitHandler<TState, TData> handler)
        {
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
            return OnSearch(new Regex($"^{dataset}$"), handler);
        }

        /// <summary>
        /// Adds a route to the application for handling Adaptive Card dynamic search events.
        /// </summary>
        /// <param name="datasetPattern">The dataset to be handled.</param>
        /// <param name="handler">The code to execute when the search is triggered.</param>
        /// <returns>The application for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSearch(Regex datasetPattern, SearchHandler<TState> handler)
        {
            RouteSelector routeSelector = CreateSearchSelector(datasetPattern);
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
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                AdaptiveCardsSearchInvokeValue searchInvokeValue = GetAdaptiveCardsSearchInvokeValue(turnContext.Activity);
                AdaptiveCardsSearchParams adaptiveCardsSearchParams = new(searchInvokeValue.QueryText, searchInvokeValue.Dataset);
                Query<AdaptiveCardsSearchParams> query = new(searchInvokeValue.QueryOptions.Top, searchInvokeValue.QueryOptions.Skip, adaptiveCardsSearchParams);
                IList<AdaptiveCardsSearchResult> results = await handler(turnContext, turnState, query, cancellationToken);

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

        private RouteSelector CreateActionExecuteSelector(Regex verbPattern)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                bool isAction = turnContext.Activity.Type == ActivityTypes.Invoke && turnContext.Activity.Name == ACTION_INVOKE_NAME;
                if (isAction)
                {
                    AdaptiveCardInvokeValue invokeValue = GetAdaptiveCardInvokeValue(turnContext.Activity);
                    return Task.FromResult(verbPattern.IsMatch(invokeValue.Action.Verb));
                }
                return Task.FromResult(false);
            };
            return routeSelector;
        }

        private RouteSelector CreateActionSubmitSelector(Regex verbPattern, string filter)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                bool isSubmit = turnContext.Activity.Type == ActivityTypes.Message && string.IsNullOrEmpty(turnContext.Activity.Text) && turnContext.Activity.Value != null;
                if (isSubmit)
                {
                    JObject? data = turnContext.Activity.Value as JObject;
                    return Task.FromResult(data != null && data[filter] != null && data[filter]!.Type == JTokenType.String && verbPattern.IsMatch(data[filter]!.Value<string>()));
                }
                return Task.FromResult(false);
            };
            return routeSelector;
        }

        private RouteSelector CreateSearchSelector(Regex datasetPattern)
        {
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                bool isSearch = turnContext.Activity.Type == ActivityTypes.Invoke && turnContext.Activity.Name == SEARCH_INVOKE_NAME;
                if (isSearch)
                {
                    AdaptiveCardsSearchInvokeValue searchInvokeValue = GetAdaptiveCardsSearchInvokeValue(turnContext.Activity);
                    return Task.FromResult(datasetPattern.IsMatch(searchInvokeValue.Dataset));
                }
                return Task.FromResult(false);
            };
            return routeSelector;
        }

        private static InvokeResponse CreateInvokeResponse(object? body)
        {
            return new InvokeResponse { Status = (int)HttpStatusCode.OK, Body = body };
        }

        private static AdaptiveCardInvokeResponse CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode statusCode, string code, string message)
        {
            return new AdaptiveCardInvokeResponse()
            {
                StatusCode = (int)statusCode,
                Type = "application/vnd.microsoft.error",
                Value = new Error()
                {
                    Code = code,
                    Message = message
                }
            };
        }

        private static AdaptiveCardInvokeValue GetAdaptiveCardInvokeValue(IInvokeActivity activity)
        {
            if (activity.Value == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing value property");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            JObject? obj = activity.Value as JObject;
            if (obj == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            AdaptiveCardInvokeValue? invokeValue;

            try
            {
                invokeValue = obj.ToObject<AdaptiveCardInvokeValue>();
                if (invokeValue == null)
                {
                    throw new InvalidOperationException("Value property is not properly formed.");
                }
            }
            catch (Exception ex)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response, ex);
            }

            if (invokeValue.Action == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing action property");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            if (invokeValue.Action.Type != ACTION_EXECUTE_TYPE)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "NotSupported", $"The action '{invokeValue.Action.Type}'is not supported.");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            return invokeValue;
        }

        private class AdaptiveCardsSearchInvokeValue : SearchInvokeValue
        {
            [JsonProperty("dataset")]
            public string Dataset { get; set; }
        }

        private class AdaptiveCardsSearchInvokeResponseValue
        {
            [JsonProperty("results")]
            public IList<AdaptiveCardsSearchResult>? Results { get; set; }
        }

        private static AdaptiveCardsSearchInvokeValue GetAdaptiveCardsSearchInvokeValue(IInvokeActivity activity)
        {
            if (activity.Value == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing value property for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            JObject? obj = activity.Value as JObject;
            if (obj == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            AdaptiveCardsSearchInvokeValue? invokeValue;

            try
            {
                invokeValue = obj.ToObject<AdaptiveCardsSearchInvokeValue>();
                if (invokeValue == null)
                {
                    throw new InvalidOperationException("Value property is not valid for search.");
                }
            }
            catch (Exception ex)
            {
                AdaptiveCardInvokeResponse errorResponse = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not valid for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, errorResponse, ex);
            }

            ValidateSearchInvokeValue(invokeValue, activity.ChannelId);
            return invokeValue;
        }

        private static void ValidateSearchInvokeValue(AdaptiveCardsSearchInvokeValue searchInvokeValue, string channelId)
        {
            string? missingField = null;

            if (string.IsNullOrEmpty(searchInvokeValue.Kind))
            {
                // Teams does not always send the 'kind' field. Default to 'search'.
                if (Channels.Msteams.Equals(channelId, StringComparison.OrdinalIgnoreCase))
                {
                    searchInvokeValue.Kind = SearchInvokeTypes.Search;
                }
                else
                {
                    missingField = "kind";
                }
            }

            if (string.IsNullOrEmpty(searchInvokeValue.QueryText))
            {
                missingField = "queryText";
            }

            if (string.IsNullOrEmpty(searchInvokeValue.Dataset))
            {
                missingField = "dataset";
            }

            if (missingField != null)
            {
                AdaptiveCardInvokeResponse errorResponse = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", $"Missing {missingField} property for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, errorResponse);
            }
        }

        private static T SafeCast<T>(object value)
        {
            JObject? obj = value as JObject;
            T? result;
            if (obj == null || (result = obj.ToObject<T>()) == null)
            {
                throw new InvokeResponseException(HttpStatusCode.BadRequest, $"expected type '{value.GetType().Name}'");
            }

            return result;
        }
    }
}
