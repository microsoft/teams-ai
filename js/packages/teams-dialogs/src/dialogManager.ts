/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    TurnContext,
    BotState,
    ConversationState,
    UserState,
    BotStateSet,
    TurnContextStateCollection,
} from '@microsoft/teams-core';

import { DialogContainer } from './dialogContainer';
import { DialogContext, DialogState } from './dialogContext';
import { internalRun } from './dialogHelper';
import { DialogSet } from './dialogSet';
import { DialogTurnStateConstants } from './dialogTurnStateConstants';
import { Dialog, DialogTurnResult } from './dialog';
import { DialogStateManagerConfiguration } from './memory';

const LAST_ACCESS = '_lastAccess';
const CONVERSATION_STATE = 'ConversationState';
const USER_STATE = 'UserState';

export interface DialogManagerResult {
    turnResult: DialogTurnResult;
}

export interface DialogManagerConfiguration {
    /**
     * State property used to persist the bots dialog stack.
     */
    conversationState: BotState;

    /**
     * Root dialog to start from [onTurn()](#onturn) method.
     */
    rootDialog: Dialog;

    /**
     * Optional. Bots persisted user state.
     */
    userState?: UserState;

    /**
     * Optional. Number of milliseconds to expire the bots conversation state after.
     */
    expireAfter?: number;

    /**
     * Optional. Path resolvers and memory scopes used for conversations with the bot.
     */
    stateConfiguration?: DialogStateManagerConfiguration;
}

/**
 * Class which runs the dialog system.
 *
 * @deprecated This class will be deprecated.
 */
export class DialogManager {
    private _rootDialogId?: string;
    private readonly _dialogStateProperty: string;
    private readonly _initialTurnState: TurnContextStateCollection = new TurnContextStateCollection();

    /**
     * Creates an instance of the [DialogSet](xref:botbuilder-dialogs.DialogManager) class.
     *
     * @param rootDialog Optional, root [Dialog](xref:botbuilder-dialogs.Dialog) to use.
     * @param dialogStateProperty Optional, alternate name for the dialogState property. (Default is "DialogStateProperty")
     */
    constructor(rootDialog?: Dialog, dialogStateProperty?: string) {
        if (rootDialog) {
            this.rootDialog = rootDialog;
        }
        this._dialogStateProperty = dialogStateProperty ?? 'DialogState';
        this._initialTurnState.set(DialogTurnStateConstants.dialogManager, this);
    }

    /**
     * Bots persisted conversation state.
     */
    public conversationState?: ConversationState;

    /**
     * Optional. Bots persisted user state.
     */
    public userState?: UserState;

    /**
     * Values that will be copied to the `TurnContext.turnState` at the beginning of each turn.
     *
     * @returns The turn state collection.
     */
    get initialTurnState(): TurnContextStateCollection {
        return this._initialTurnState;
    }

    /**
     * Root dialog to start from [onTurn()](#onturn) method.
     */
    set rootDialog(value: Dialog|undefined) {
        this.dialogs = new DialogSet();
        if (value) {
            this._rootDialogId = value.id;
            this.dialogs.telemetryClient = value.telemetryClient;
            this.dialogs.add(value);
            this.registerContainerDialogs(this.rootDialog!, false);
        } else {
            this._rootDialogId = undefined;
        }
    }

    /**
     * Gets the root [Dialog](xref:botbuilder-dialogs.Dialog) ID.
     *
     * @returns The root [Dialog](xref:botbuilder-dialogs.Dialog) ID.
     */
    get rootDialog(): Dialog|undefined {
        return this._rootDialogId ? this.dialogs.find(this._rootDialogId) : undefined;
    }

    /**
     * Global dialogs that you want to have be callable.
     */
    dialogs: DialogSet = new DialogSet();

    /**
     * Optional. Path resolvers and memory scopes used for conversations with the bot.
     */
    stateConfiguration?: DialogStateManagerConfiguration;

    /**
     * Optional. Number of milliseconds to expire the bots conversation state after.
     */
    expireAfter?: number;

    /**
     * Runs dialog system in the context of a [TurnContext](xref:botbuilder-core.TurnContext).
     *
     * @param context [TurnContext](xref:botbuilder-core.TurnContext) for the current turn of conversation with the user.
     * @returns Result of running the logic against the activity.
     */
    async onTurn(context: TurnContext): Promise<DialogManagerResult> {
        // Ensure properly configured
        if (!this._rootDialogId) {
            throw new Error("DialogManager.onTurn: the bot's 'rootDialog' has not been configured.");
        }

        // Copy initial turn state to context
        this.initialTurnState.forEach((value, key): void => {
            context.turnState.set(key, value);
        });

        const botStateSet = new BotStateSet();

        if (!this.conversationState) {
            this.conversationState = context.turnState.get(CONVERSATION_STATE);
        } else {
            context.turnState.set(CONVERSATION_STATE, this.conversationState);
        }

        if (!this.conversationState) {
            throw new Error("DialogManager.onTurn: the bot's 'conversationState' has not been configured.");
        }
        botStateSet.add(this.conversationState);

        if (!this.userState) {
            this.userState = context.turnState.get(USER_STATE);
        } else {
            context.turnState.set(USER_STATE, this.userState);
        }

        if (this.userState) {
            botStateSet.add(this.userState);
        }

        // Get last access
        const lastAccessProperty = this.conversationState.createProperty(LAST_ACCESS);
        const lastAccess = new Date(await lastAccessProperty.get(context, new Date().toISOString()));

        // Check for expired conversation
        const now = new Date();
        if (this.expireAfter != undefined && now.getTime() - lastAccess.getTime() >= this.expireAfter) {
            // Clear conversation state
            await this.conversationState.clear(context);
        }

        // Update last access time
        await lastAccessProperty.set(context, lastAccess.toISOString());

        // get dialog stack
        const dialogsProperty = this.conversationState.createProperty(this._dialogStateProperty);
        const dialogState: DialogState = await dialogsProperty.get(context, {});

        // Create DialogContext
        const dc = new DialogContext(this.dialogs, context, dialogState);

        // Call the common dialog "continue/begin" execution pattern shared with the classic RunAsync extension method
        const turnResult = await internalRun(context, this._rootDialogId, dc, this.stateConfiguration);

        // Save BotState changes
        await botStateSet.saveAllChanges(dc.context, false);

        return { turnResult };
    }

    // Recursively traverses the dialog tree and registers intances of `DialogContainer` in the `DialogSet`
    // for this `DialogManager` instance.
    private registerContainerDialogs(dialog: Dialog, registerRoot = true): void {
        if (!(dialog instanceof DialogContainer)) {
            return;
        }
        const container = dialog;
        if (registerRoot) {
            if (this.dialogs.getDialogs().find((dlg) => dlg === container)) {
                return;
            }
            this.dialogs.add(container);
        }

        container.dialogs.getDialogs().forEach((inner) => {
            this.registerContainerDialogs(inner);
        });
    }
}
