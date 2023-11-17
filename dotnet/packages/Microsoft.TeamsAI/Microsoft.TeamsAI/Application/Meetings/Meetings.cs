using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Meetings class to enable fluent style registration of handlers related to Microsoft Teams Meetings.
    /// </summary>
    /// <typeparam name="TState">The type of the turn state object used by the application.</typeparam>
    public class Meetings<TState>
        where TState : TurnState<Record, Record, TempState>, new()
    {
        private readonly Application<TState> _app;

        /// <summary>
        /// Creates a new instance of the Meetings class.
        /// </summary>
        /// <param name="app"></param> The top level application class to register handlers with.
        public Meetings(Application<TState> app)
        {
            this._app = app;
        }

        /// <summary>
        /// Handles Microsoft Teams meeting start events.
        /// </summary>
        /// <param name="handler">Function to call when a Microsoft Teams meeting start event activity is received from the connector.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnStart(MeetingStartHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.Event, StringComparison.OrdinalIgnoreCase)
                && string.Equals(context.Activity?.ChannelId, Channels.Msteams)
                && string.Equals(context.Activity?.Name, "application/vnd.microsoft.meetingStart")
            );
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                MeetingStartEventDetails meeting = ActivityUtilities.GetTypedValue<MeetingStartEventDetails>(turnContext.Activity) ?? new();
                await handler(turnContext, turnState, meeting, cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: false);
            return _app;
        }

        /// <summary>
        /// Handles Microsoft Teams meeting end events.
        /// </summary>
        /// <param name="handler">Function to call when a Microsoft Teams meeting end event activity is received from the connector.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnEnd(MeetingEndHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.Event, StringComparison.OrdinalIgnoreCase)
                && string.Equals(context.Activity?.ChannelId, Channels.Msteams)
                && string.Equals(context.Activity?.Name, "application/vnd.microsoft.meetingEnd")
            );
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                MeetingEndEventDetails meeting = ActivityUtilities.GetTypedValue<MeetingEndEventDetails>(turnContext.Activity) ?? new();
                await handler(turnContext, turnState, meeting, cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: false);
            return _app;
        }

        /// <summary>
        /// Handles Microsoft Teams meeting participants join events.
        /// </summary>
        /// <param name="handler">Function to call when a Microsoft Teams meeting participants join event activity is received from the connector.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnParticipantsJoin(MeetingParticipantsEventHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.Event, StringComparison.OrdinalIgnoreCase)
                && string.Equals(context.Activity?.ChannelId, Channels.Msteams)
                && string.Equals(context.Activity?.Name, "application/vnd.microsoft.meetingParticipantJoin")
            );
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                MeetingParticipantsEventDetails meeting = ActivityUtilities.GetTypedValue<MeetingParticipantsEventDetails>(turnContext.Activity) ?? new();
                await handler(turnContext, turnState, meeting, cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: false);
            return _app;
        }

        /// <summary>
        /// Handles Microsoft Teams meeting participants leave events.
        /// </summary>
        /// <param name="handler">Function to call when a Microsoft Teams meeting participants leave event activity is received from the connector.</param>
        /// <returns>The application instance for chaining purposes.</returns>
        public Application<TState> OnParticipantsLeave(MeetingParticipantsEventHandler<TState> handler)
        {
            Verify.ParamNotNull(handler);
            RouteSelector routeSelector = (context, _) => Task.FromResult
            (
                string.Equals(context.Activity?.Type, ActivityTypes.Event, StringComparison.OrdinalIgnoreCase)
                && string.Equals(context.Activity?.ChannelId, Channels.Msteams)
                && string.Equals(context.Activity?.Name, "application/vnd.microsoft.meetingParticipantLeave")
            );
            RouteHandler<TState> routeHandler = async (turnContext, turnState, cancellationToken) =>
            {
                MeetingParticipantsEventDetails meeting = ActivityUtilities.GetTypedValue<MeetingParticipantsEventDetails>(turnContext.Activity) ?? new();
                await handler(turnContext, turnState, meeting, cancellationToken);
            };
            _app.AddRoute(routeSelector, routeHandler, isInvokeRoute: false);
            return _app;
        }
    }
}
