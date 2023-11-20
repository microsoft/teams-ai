import { ActivityTypes, MeetingEndEventDetails, MeetingParticipantsEventDetails, MeetingStartEventDetails, TurnContext } from "botbuilder";
import { Application } from "./Application";
import { TurnState } from "./TurnState";

export class Meetings<TState extends TurnState = TurnState> {
  private readonly _app: Application<TState>;

  public constructor(app: Application<TState>) {
    this._app = app;
  }

  public start(handler: (context: TurnContext, state: TState, meeting: MeetingStartEventDetails) => Promise<void>): Application<TState> {
    const selector = (context: TurnContext): Promise<boolean> => {
      return Promise.resolve(context.activity.type === ActivityTypes.Event && context.activity.channelId === 'msteams' && context.activity.name === 'application/vnd.microsoft.meetingStart');
    }

    const handlerWrapper = (context: TurnContext, state: TState): Promise<void> => {
      const meeting = context.activity.value as MeetingStartEventDetails;
      return handler(context, state, meeting);
    }

    this._app.addRoute(selector, handlerWrapper);

    return this._app;
  }

  public end(handler: (context: TurnContext, state: TState, meeting: MeetingEndEventDetails) => Promise<void>): Application<TState> {
    const selector = (context: TurnContext): Promise<boolean> => {
      return Promise.resolve(context.activity.type === ActivityTypes.Event && context.activity.channelId === 'msteams' && context.activity.name === 'application/vnd.microsoft.meetingEnd');
    }

    const handlerWrapper = (context: TurnContext, state: TState): Promise<void> => {
      const meeting = context.activity.value as MeetingEndEventDetails;
      return handler(context, state, meeting);
    }

    this._app.addRoute(selector, handlerWrapper);

    return this._app;
  }

  public participantsJoin(handler: (context: TurnContext, state: TState, meeting: MeetingParticipantsEventDetails) => Promise<void>): Application<TState> {
    const selector = (context: TurnContext): Promise<boolean> => {
      return Promise.resolve(context.activity.type === ActivityTypes.Event && context.activity.channelId === 'msteams' && context.activity.name === 'application/vnd.microsoft.meetingParticipantsJoin');
    }

    const handlerWrapper = (context: TurnContext, state: TState): Promise<void> => {
      const meeting = context.activity.value as MeetingParticipantsEventDetails;
      return handler(context, state, meeting);
    }

    this._app.addRoute(selector, handlerWrapper);

    return this._app;
  }

  public participantsLeave(handler: (context: TurnContext, state: TState, meeting: MeetingParticipantsEventDetails) => Promise<void>): Application<TState> {
    const selector = (context: TurnContext): Promise<boolean> => {
      return Promise.resolve(context.activity.type === ActivityTypes.Event && context.activity.channelId === 'msteams' && context.activity.name === 'application/vnd.microsoft.meetingParticipantsLeave');
    }

    const handlerWrapper = (context: TurnContext, state: TState): Promise<void> => {
      const meeting = context.activity.value as MeetingParticipantsEventDetails;
      return handler(context, state, meeting);
    }

    this._app.addRoute(selector, handlerWrapper);

    return this._app;
  }
}