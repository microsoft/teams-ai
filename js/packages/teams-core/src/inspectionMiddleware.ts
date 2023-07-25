/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { v4 as uuidv4 } from 'uuid';
import { MicrosoftAppCredentials, ConnectorClient } from '@microsoft/teams-connector';
import {
    Activity,
    ActivityTypes,
    ConversationReference,
} from '@microsoft/teams-connector/src/schema';
import { teamsGetTeamId } from './teamsActivityHelpers';
import { Middleware } from './middlewareSet';
import { BotState } from './botState';
import { TurnContext } from './turnContext';
import { StatePropertyAccessor } from './botStatePropertyAccessor';
import { UserState } from './userState';
import { ConversationState } from './conversationState';
import { Storage } from './storage';

/** @private */
class TraceActivity {
    static makeCommandActivity(command: string): Partial<Activity> {
        return {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            name: 'Command',
            label: 'Command',
            value: command,
            valueType: 'https://www.botframework.com/schemas/command',
        };
    }

    static fromActivity(activity: Activity | Partial<Activity>, name: string, label: string): Partial<Activity> {
        return {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            name: name,
            label: label,
            value: activity,
            valueType: 'https://www.botframework.com/schemas/activity',
        };
    }

    static fromState(botState: BotState): Partial<Activity> {
        return {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            name: 'BotState',
            label: 'Bot State',
            value: botState,
            valueType: 'https://www.botframework.com/schemas/botState',
        };
    }

    static fromConversationReference(conversationReference: Partial<ConversationReference>): Partial<Activity> {
        return {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            name: 'Deleted Message',
            label: 'MessageDelete',
            value: conversationReference,
            valueType: 'https://www.botframework.com/schemas/conversationReference',
        };
    }

    static fromError(errorMessage: string): Partial<Activity> {
        return {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            name: 'Turn Error',
            label: 'TurnError',
            value: errorMessage,
            valueType: 'https://www.botframework.com/schemas/error',
        };
    }
}

/** @private */
abstract class InterceptionMiddleware implements Middleware {
    /**
     * Implement middleware signature
     *
     * @param turnContext {TurnContext} An incoming TurnContext object.
     * @param next {function} The next delegate function.
     */
    async onTurn(turnContext: TurnContext, next: () => Promise<void>): Promise<void> {
        const { shouldForwardToApplication, shouldIntercept } = await this.invokeInbound(
            turnContext,
            TraceActivity.fromActivity(turnContext.activity, 'ReceivedActivity', 'Received Activity')
        );

        if (shouldIntercept) {
            turnContext.onSendActivities(async (ctx, activities, nextSend) => {
                const traceActivities: Partial<Activity>[] = [];
                activities.forEach((activity) => {
                    traceActivities.push(TraceActivity.fromActivity(activity, 'SentActivity', 'Sent Activity'));
                });
                await this.invokeOutbound(ctx, traceActivities);
                return await nextSend();
            });

            turnContext.onUpdateActivity(async (ctx, activity, nextUpdate) => {
                const traceActivity = TraceActivity.fromActivity(activity, 'MessageUpdate', 'Updated Message');
                await this.invokeOutbound(ctx, [traceActivity]);
                return await nextUpdate();
            });

            turnContext.onDeleteActivity(async (ctx, reference, nextDelete) => {
                const traceActivity = TraceActivity.fromConversationReference(reference);
                await this.invokeOutbound(ctx, [traceActivity]);
                return await nextDelete();
            });
        }

        if (shouldForwardToApplication) {
            try {
                await next();
            } catch (err: unknown) {
                const traceActivity = TraceActivity.fromError((err as Error).toString());
                await this.invokeOutbound(turnContext, [traceActivity]);
                throw err;
            }
        }

        if (shouldIntercept) {
            await this.invokeTraceState(turnContext);
        }
    }

    protected abstract inbound(turnContext: TurnContext, traceActivity: Partial<Activity>): Promise<any>;

    protected abstract outbound(turnContext: TurnContext, traceActivities: Partial<Activity>[]): Promise<any>;

    protected abstract traceState(turnContext: TurnContext): Promise<any>;

    private async invokeInbound(turnContext: TurnContext, traceActivity: Partial<Activity>): Promise<any> {
        try {
            return await this.inbound(turnContext, traceActivity);
        } catch (err: unknown) {
            console.warn(`Exception in inbound interception ${err}`);
            return { shouldForwardToApplication: true, shouldIntercept: false };
        }
    }

    private async invokeOutbound(turnContext: TurnContext, traceActivities: Partial<Activity>[]): Promise<any> {
        try {
            await this.outbound(turnContext, traceActivities);
        } catch (err: unknown) {
            console.warn(`Exception in outbound interception ${err}`);
        }
    }

    private async invokeTraceState(turnContext: TurnContext): Promise<any> {
        try {
            await this.traceState(turnContext);
        } catch (err: unknown) {
            console.warn(`Exception in state interception ${err}`);
        }
    }
}

/**
 * InspectionMiddleware for emulator inspection of runtime Activities and BotState.
 *
 * @remarks
 * InspectionMiddleware for emulator inspection of runtime Activities and BotState.
 *
 * @deprecated This class will be removed in a future version of the framework.
 */
export class InspectionMiddleware extends InterceptionMiddleware {
    private static readonly command = '/INSPECT';

    private readonly inspectionState: InspectionState;
    private readonly inspectionStateAccessor: StatePropertyAccessor<InspectionSessionsByStatus>;
    private readonly userState?: UserState;
    private readonly conversationState?: ConversationState;
    private readonly credentials: MicrosoftAppCredentials;

    /**
     * Create the Inspection middleware for sending trace activities out to an emulator session
     *
     * @param inspectionState A state management object for inspection state.
     * @param userState A state management object for user state.
     * @param conversationState A state management object for conversation state.
     * @param credentials The authentication credentials.
     */
    constructor(
        inspectionState: InspectionState,
        userState?: UserState,
        conversationState?: ConversationState,
        credentials?: Partial<MicrosoftAppCredentials>
    ) {
        super();

        this.inspectionState = inspectionState;
        this.inspectionStateAccessor = inspectionState.createProperty('InspectionSessionByStatus');
        this.userState = userState;
        this.conversationState = conversationState;
        credentials = { appId: '', appPassword: '', ...credentials };
        this.credentials = new MicrosoftAppCredentials(credentials.appId!, credentials.appPassword!);
    }

    /**
     * Indentifies open and attach commands and calls the appropriate method.
     *
     * @param turnContext The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @returns True if the command is open or attached, otherwise false.
     */
    async processCommand(turnContext: TurnContext): Promise<any> {
        if (turnContext.activity.type == ActivityTypes.Message && turnContext.activity.text !== undefined) {
            const originalText = turnContext.activity.text;
            TurnContext.removeRecipientMention(turnContext.activity);

            const command = turnContext.activity.text.trim().split(' ');
            if (command.length > 1 && command[0] === InspectionMiddleware.command) {
                if (command.length === 2 && command[1] === 'open') {
                    await this.processOpenCommand(turnContext);
                    return true;
                }

                if (command.length === 3 && command[1] === 'attach') {
                    await this.processAttachCommand(turnContext, command[2]);
                    return true;
                }
            }

            turnContext.activity.text = originalText;
        }

        return false;
    }

    /**
     * Processes inbound activities.
     *
     * @param turnContext The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param traceActivity The trace activity.
     * @returns {Promise<any>} A promise representing the asynchronous operation.
     */
    protected async inbound(turnContext: TurnContext, traceActivity: Partial<Activity>): Promise<any> {
        if (await this.processCommand(turnContext)) {
            return { shouldForwardToApplication: false, shouldIntercept: false };
        }

        const session = await this.findSession(turnContext);
        if (session !== undefined) {
            if (await this.invokeSend(turnContext, session, traceActivity)) {
                return { shouldForwardToApplication: true, shouldIntercept: true };
            } else {
                return { shouldForwardToApplication: true, shouldIntercept: false };
            }
        } else {
            return { shouldForwardToApplication: true, shouldIntercept: false };
        }
    }

    /**
     * Processes outbound activities.
     *
     * @param turnContext The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @param traceActivities A collection of trace activities.
     */
    protected async outbound(turnContext: TurnContext, traceActivities: Partial<Activity>[]): Promise<any> {
        const session = await this.findSession(turnContext);
        if (session !== undefined) {
            for (let i = 0; i < traceActivities.length; i++) {
                const traceActivity = traceActivities[i];
                if (!(await this.invokeSend(turnContext, session, traceActivity))) {
                    break;
                }
            }
        }
    }

    /**
     * Processes the state management object.
     *
     * @param turnContext The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     */
    protected async traceState(turnContext: TurnContext): Promise<any> {
        const session = await this.findSession(turnContext);
        if (session !== undefined) {
            if (this.userState !== undefined) {
                await this.userState.load(turnContext, false);
            }
            if (this.conversationState != undefined) {
                await this.conversationState.load(turnContext, false);
            }

            const botState: any = {};

            if (this.userState !== undefined) {
                botState.userState = this.userState.get(turnContext);
            }

            if (this.conversationState !== undefined) {
                botState.conversationState = this.conversationState.get(turnContext);
            }

            await this.invokeSend(turnContext, session, TraceActivity.fromState(botState));
        }
    }

    /**
     * @private
     */
    private async processOpenCommand(turnContext: TurnContext): Promise<any> {
        const sessions = await this.inspectionStateAccessor.get(turnContext, InspectionSessionsByStatus.DefaultValue);
        const sessionId = this.openCommand(sessions, TurnContext.getConversationReference(turnContext.activity));
        await turnContext.sendActivity(
            TraceActivity.makeCommandActivity(`${InspectionMiddleware.command} attach ${sessionId}`)
        );
        await this.inspectionState.saveChanges(turnContext, false);
    }

    /**
     * @private
     */
    private async processAttachCommand(turnContext: TurnContext, sessionId: string): Promise<any> {
        const sessions = await this.inspectionStateAccessor.get(turnContext, InspectionSessionsByStatus.DefaultValue);
        if (this.attachCommand(this.getAttachId(turnContext.activity), sessions, sessionId)) {
            await turnContext.sendActivity('Attached to session, all traffic is being replicated for inspection.');
        } else {
            await turnContext.sendActivity(`Open session with id ${sessionId} does not exist.`);
        }

        await this.inspectionState.saveChanges(turnContext, false);
    }

    /**
     * @private
     */
    private openCommand(
        sessions: InspectionSessionsByStatus,
        conversationReference: Partial<ConversationReference>
    ): string {
        const sessionId = uuidv4();
        sessions.openedSessions[sessionId] = conversationReference;
        return sessionId;
    }

    /**
     * @private
     */
    private attachCommand(attachId: string, sessions: InspectionSessionsByStatus, sessionId: string): boolean {
        const inspectionSessionState = sessions.openedSessions[sessionId];
        if (inspectionSessionState !== undefined) {
            sessions.attachedSessions[attachId] = inspectionSessionState;
            delete sessions.openedSessions[sessionId];
            return true;
        }
        return false;
    }

    /**
     * @private
     */
    private async findSession(turnContext: TurnContext): Promise<any> {
        const sessions = await this.inspectionStateAccessor.get(turnContext, InspectionSessionsByStatus.DefaultValue);

        const conversationReference = sessions.attachedSessions[this.getAttachId(turnContext.activity)];
        if (conversationReference !== undefined) {
            return new InspectionSession(conversationReference, this.credentials);
        }

        return undefined;
    }

    /**
     * @private
     */
    private async invokeSend(
        turnContext: TurnContext,
        session: InspectionSession,
        activity: Partial<Activity>
    ): Promise<any> {
        if (await session.send(activity)) {
            return true;
        } else {
            await this.cleanUpSession(turnContext);
            return false;
        }
    }

    /**
     * @private
     */
    private async cleanUpSession(turnContext: TurnContext): Promise<any> {
        const sessions = await this.inspectionStateAccessor.get(turnContext, InspectionSessionsByStatus.DefaultValue);

        delete sessions.attachedSessions[this.getAttachId(turnContext.activity)];
        await this.inspectionState.saveChanges(turnContext, false);
    }

    /**
     * @private
     */
    private getAttachId(activity: Activity): string {
        // If we are running in a Microsoft Teams Team the conversation Id will reflect a particular thread the bot is in.
        // So if we are in a Team then we will associate the "attach" with the Team Id rather than the more restrictive conversation Id.
        const teamId = teamsGetTeamId(activity);
        return teamId ? teamId : activity.conversation.id;
    }
}

/** @private */
class InspectionSession {
    private readonly conversationReference: Partial<ConversationReference>;
    private readonly connectorClient: ConnectorClient;

    constructor(conversationReference: Partial<ConversationReference>, credentials: MicrosoftAppCredentials) {
        this.conversationReference = conversationReference;
        this.connectorClient = new ConnectorClient(credentials, { baseUri: conversationReference.serviceUrl });
    }

    async send(activity: Partial<Activity>): Promise<any> {
        TurnContext.applyConversationReference(activity, this.conversationReference);

        try {
            await this.connectorClient.conversations.sendToConversation(activity.conversation!.id, activity as Activity);
        } catch {
            return false;
        }

        return true;
    }
}

/** @private */
class InspectionSessionsByStatus {
    static DefaultValue: InspectionSessionsByStatus = new InspectionSessionsByStatus();

    openedSessions: { [id: string]: Partial<ConversationReference> } = {};

    attachedSessions: { [id: string]: Partial<ConversationReference> } = {};
}

/**
 * InspectionState for use by the InspectionMiddleware for emulator inspection of runtime Activities and BotState.
 *
 * @remarks
 * InspectionState for use by the InspectionMiddleware for emulator inspection of runtime Activities and BotState.
 *
 * @deprecated This class will be removed in a future version of the framework.
 */
export class InspectionState extends BotState {
    /**
     * Creates a new instance of the [InspectionState](xref:botbuilder.InspectionState)  class.
     *
     * @param storage The [Storage](xref:botbuilder-core.Storage) layer this state management object will use to store and retrieve state.
     */
    constructor(storage: Storage) {
        super(storage, (context: TurnContext) => {
            return Promise.resolve(this.getStorageKey(context));
        });
    }

    /**
     * Gets the key to use when reading and writing state to and from storage.
     *
     * @param _turnContext The [TurnContext](xref:botbuilder-core.TurnContext) for this turn.
     * @returns The storage key.
     */
    protected getStorageKey(_turnContext: TurnContext) {
        return 'InspectionState';
    }
}
