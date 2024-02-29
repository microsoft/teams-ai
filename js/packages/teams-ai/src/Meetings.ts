import {
    ActivityTypes,
    MeetingEndEventDetails,
    MeetingParticipantsEventDetails,
    MeetingStartEventDetails,
    TurnContext
} from 'botbuilder';
import { Application } from './Application';
import { TurnState } from './TurnState';

/**
 * Provides a set of methods for handling Teams meeting events.
 */
export class Meetings<TState extends TurnState = TurnState> {
    private readonly _app: Application<TState>;

    public constructor(app: Application<TState>) {
        this._app = app;
    }

    /**
     * Handles meeting start events for Microsoft Teams.
     * @template TState
     * @param {Function} handler - Function to call when the handler is triggered.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public start(
        handler: (context: TurnContext, state: TState, meeting: MeetingStartEventDetails) => Promise<void>
    ): Application<TState> {
        const selector = (context: TurnContext): Promise<boolean> => {
            return Promise.resolve(
                context.activity.type === ActivityTypes.Event &&
                    context.activity.channelId === 'msteams' &&
                    context.activity.name === 'application/vnd.microsoft.meetingStart'
            );
        };

        const handlerWrapper = (context: TurnContext, state: TState): Promise<void> => {
            const meeting = context.activity.value as MeetingStartEventDetails;
            return handler(context, state, meeting);
        };

        this._app.addRoute(selector, handlerWrapper);

        return this._app;
    }

    /**
     * Handles meeting end events for Microsoft Teams.
     * @template TState - The type of TurnState
     * @param {Function} handler - Function to call when the handler is triggered.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public end(
        handler: (context: TurnContext, state: TState, meeting: MeetingEndEventDetails) => Promise<void>
    ): Application<TState> {
        const selector = (context: TurnContext): Promise<boolean> => {
            return Promise.resolve(
                context.activity.type === ActivityTypes.Event &&
                    context.activity.channelId === 'msteams' &&
                    context.activity.name === 'application/vnd.microsoft.meetingEnd'
            );
        };

        const handlerWrapper = (context: TurnContext, state: TState): Promise<void> => {
            const meeting = context.activity.value as MeetingEndEventDetails;
            return handler(context, state, meeting);
        };

        this._app.addRoute(selector, handlerWrapper);

        return this._app;
    }

    /**
     * Handles meeting participant join events for Microsoft Teams.
     * @template TState
     * @param {Function} handler - Function to call when the handler is triggered.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public participantsJoin(
        handler: (context: TurnContext, state: TState, meeting: MeetingParticipantsEventDetails) => Promise<void>
    ): Application<TState> {
        const selector = (context: TurnContext): Promise<boolean> => {
            return Promise.resolve(
                context.activity.type === ActivityTypes.Event &&
                    context.activity.channelId === 'msteams' &&
                    context.activity.name === 'application/vnd.microsoft.meetingParticipantsJoin'
            );
        };

        const handlerWrapper = (context: TurnContext, state: TState): Promise<void> => {
            const meeting = context.activity.value as MeetingParticipantsEventDetails;
            return handler(context, state, meeting);
        };

        this._app.addRoute(selector, handlerWrapper);

        return this._app;
    }

    /**
     * Handles meeting participant leave events for Microsoft Teams.
     * @template TState - The type of TurnState
     * @param {Function} handler - Function to call when the handler is triggered.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public participantsLeave(
        handler: (context: TurnContext, state: TState, meeting: MeetingParticipantsEventDetails) => Promise<void>
    ): Application<TState> {
        const selector = (context: TurnContext): Promise<boolean> => {
            return Promise.resolve(
                context.activity.type === ActivityTypes.Event &&
                    context.activity.channelId === 'msteams' &&
                    context.activity.name === 'application/vnd.microsoft.meetingParticipantsLeave'
            );
        };

        const handlerWrapper = (context: TurnContext, state: TState): Promise<void> => {
            const meeting = context.activity.value as MeetingParticipantsEventDetails;
            return handler(context, state, meeting);
        };

        this._app.addRoute(selector, handlerWrapper);

        return this._app;
    }
}
