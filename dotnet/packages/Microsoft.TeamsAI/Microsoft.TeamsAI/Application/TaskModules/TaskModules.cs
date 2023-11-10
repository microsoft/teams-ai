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
    /// TaskModules class to enable fluent style registration of handlers related to Task Modules.
    /// </summary>
    /// <typeparam name="TState">The type of the turn state object used by the application.</typeparam>
    /// <typeparam name="TTurnStateManager">The type of the turn state manager object used by the application.</typeparam>
    public class TaskModules<TState, TTurnStateManager>
       where TState : ITurnState<StateBase, StateBase, TempState>
       where TTurnStateManager : ITurnStateManager<TState>, new()
    {
        private static readonly string FETCH_INVOKE_NAME = "task/fetch";
        private static readonly string SUBMIT_INVOKE_NAME = "task/submit";
        private static readonly string DEFAULT_TASK_DATA_FILTER = "verb";

        private readonly Application<TState, TTurnStateManager> _app;

        /// <summary>
        /// Creates a new instance of the TaskModules class.
        /// </summary>
        /// <param name="app"> The top level application class to register handlers with.</param>
        public TaskModules(Application<TState, TTurnStateManager> app)
        {
            this._app = app;
        }

        /// <summary>
        ///  Registers a handler to process the initial fetch of the task module.
        /// </summary>
        /// <param name="verb">Name of the verb to register the handler for.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnFetch(string verb, FetchHandler<TState> handler)
        {
            Verify.ParamNotNull(verb);
            Verify.ParamNotNull(handler);
            string filter = _app.Options.TaskModules?.TaskDataFilter ?? DEFAULT_TASK_DATA_FILTER;
            RouteSelector routeSelector = CreateTaskSelector((string input) => string.Equals(verb, input), filter, FETCH_INVOKE_NAME);
            return OnFetch(routeSelector, handler);
        }

        /// <summary>
        ///  Registers a handler to process the initial fetch of the task module.
        /// </summary>
        /// <param name="verbPattern">Regular expression to match against the verbs to register the handler for.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnFetch(Regex verbPattern, FetchHandler<TState> handler)
        {
            Verify.ParamNotNull(verbPattern);
            Verify.ParamNotNull(handler);
            string filter = _app.Options.TaskModules?.TaskDataFilter ?? DEFAULT_TASK_DATA_FILTER;
            RouteSelector routeSelector = CreateTaskSelector((string input) => verbPattern.IsMatch(input), filter, FETCH_INVOKE_NAME);
            return OnFetch(routeSelector, handler);
        }

        /// <summary>
        ///  Registers a handler to process the initial fetch of the task module.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnFetch(RouteSelector routeSelector, FetchHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                TaskModuleAction? taskModuleAction;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, FETCH_INVOKE_NAME)
                    || (taskModuleAction = ActivityUtilities.GetTypedValue<TaskModuleAction>(turnContext.Activity)) == null)
                {
                    throw new TeamsAIException($"Unexpected TaskModules.OnFetch() triggered for activity type: {turnContext.Activity.Type}");
                }

                TaskModuleResponse result = await handler(turnContext, turnState, taskModuleAction.Value, cancellationToken);

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
        ///  Registers a handler to process the initial fetch of the task module.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector selectors.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnFetch(MultipleRouteSelector routeSelectors, FetchHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);

            if (routeSelectors.Strings != null)
            {
                foreach (string verb in routeSelectors.Strings)
                {
                    OnFetch(verb, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex verbPattern in routeSelectors.Regexes)
                {
                    OnFetch(verbPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnFetch(routeSelector, handler);
                }
            }

            return _app;
        }

        /// <summary>
        /// Registers a handler to process the submission of a task module.
        /// </summary>
        /// <param name="verb">Name of the verb to register the handler for.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSubmit(string verb, SubmitHandler<TState> handler)
        {
            Verify.ParamNotNull(verb);
            Verify.ParamNotNull(handler);
            string filter = _app.Options.TaskModules?.TaskDataFilter ?? DEFAULT_TASK_DATA_FILTER;
            RouteSelector routeSelector = CreateTaskSelector((string input) => string.Equals(verb, input), filter, SUBMIT_INVOKE_NAME);
            return OnSubmit(routeSelector, handler);
        }


        /// <summary>
        /// Registers a handler to process the submission of a task module.
        /// </summary>
        /// <param name="verbPattern">Regular expression to match against the verbs to register the handler for</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSubmit(Regex verbPattern, SubmitHandler<TState> handler)
        {
            Verify.ParamNotNull(verbPattern);
            Verify.ParamNotNull(handler);
            string filter = _app.Options.TaskModules?.TaskDataFilter ?? DEFAULT_TASK_DATA_FILTER;
            RouteSelector routeSelector = CreateTaskSelector((string input) => verbPattern.IsMatch(input), filter, SUBMIT_INVOKE_NAME);
            return OnSubmit(routeSelector, handler);
        }

        /// <summary>
        /// Registers a handler to process the submission of a task module.
        /// </summary>
        /// <param name="routeSelector">Function that's used to select a route. The function returning true triggers the route.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSubmit(RouteSelector routeSelector, SubmitHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelector);
            Verify.ParamNotNull(handler);
            RouteHandler<TState> routeHandler = async (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) =>
            {
                TaskModuleAction? taskModuleAction;
                if (!string.Equals(turnContext.Activity.Type, ActivityTypes.Invoke, StringComparison.OrdinalIgnoreCase)
                    || !string.Equals(turnContext.Activity.Name, SUBMIT_INVOKE_NAME)
                    || (taskModuleAction = ActivityUtilities.GetTypedValue<TaskModuleAction>(turnContext.Activity)) == null)
                {
                    throw new TeamsAIException($"Unexpected TaskModules.OnSubmit() triggered for activity type: {turnContext.Activity.Type}");
                }

                TaskModuleResponse result = await handler(turnContext, turnState, taskModuleAction.Value, cancellationToken);

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
        /// Registers a handler to process the submission of a task module.
        /// </summary>
        /// <param name="routeSelectors">Combination of String, Regex, and RouteSelector verb(s) to register the handler for.</param>
        /// <param name="handler">Function to call when the route is triggered.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState, TTurnStateManager> OnSubmit(MultipleRouteSelector routeSelectors, SubmitHandler<TState> handler)
        {
            Verify.ParamNotNull(routeSelectors);
            Verify.ParamNotNull(handler);

            if (routeSelectors.Strings != null)
            {
                foreach (string verb in routeSelectors.Strings)
                {
                    OnSubmit(verb, handler);
                }
            }
            if (routeSelectors.Regexes != null)
            {
                foreach (Regex verbPattern in routeSelectors.Regexes)
                {
                    OnSubmit(verbPattern, handler);
                }
            }
            if (routeSelectors.RouteSelectors != null)
            {
                foreach (RouteSelector routeSelector in routeSelectors.RouteSelectors)
                {
                    OnSubmit(routeSelector, handler);
                }
            }

            return _app;
        }

        private static RouteSelector CreateTaskSelector(Func<string, bool> isMatch, string filter, string invokeName)
        {
            RouteSelector routeSelector = (ITurnContext turnContext, CancellationToken cancellationToken) =>
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

                JObject? data = obj["data"] as JObject;
                if (data == null)
                {
                    return Task.FromResult(false);
                }

                bool isVerbMatch = data.TryGetValue(filter, out JToken? filterField) && filterField != null && filterField.Type == JTokenType.String
                && isMatch(filterField.Value<string>()!);

                return Task.FromResult(isVerbMatch);
            };
            return routeSelector;
        }
    }
}
