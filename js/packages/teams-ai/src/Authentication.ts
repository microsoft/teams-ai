/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ActivityTypes,
    TurnContext,
    tokenExchangeOperationName,
    tokenResponseEventName,
    verifyStateOperationName
} from 'botbuilder';
import {
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus,
    OAuthPrompt,
    OAuthPromptSettings
} from 'botbuilder-dialogs';
import { TurnState } from './TurnState';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { TurnStateProperty } from './TurnStateProperty';
import { Application } from './Application';

/**
 * @private
 */
const MEMORY_SCOPE = 'conversation';

/**
 * @private
 */
const DIALOG_STATE_PROPERTY = 'DialogState';

/**
 * Authentication service.
 */
export class Authentication<TState extends TurnState = DefaultTurnState> {
    private readonly _oauthPrompt: OAuthPrompt;

    /**
     * Creates a new instance of the `Authentication` class.
     * @param app Application for adding routes.
     * @param settings Authentication settings.
     */
    constructor(app: Application<TState>, settings: OAuthPromptSettings) {
        // Create OAuthPrompt
        this._oauthPrompt = new OAuthPrompt('OAuthPrompt', settings);

        // Add application routes to handle OAuth callbacks
        app.addRoute(
            (context) => Promise.resolve(context.activity.type === ActivityTypes.Event && context.activity.name === tokenResponseEventName),
            async (context, state) => {
                await this.runDialog(context, state);
            },
            false);
        app.addRoute(
            (context) => Promise.resolve(context.activity.type === ActivityTypes.Invoke && context.activity.name === verifyStateOperationName),
            async (context, state) => {
                await this.runDialog(context, state);
            },
            true);
        app.addRoute(
            (context) => Promise.resolve(context.activity.type === ActivityTypes.Invoke && context.activity.name === tokenExchangeOperationName),
            async (context, state) => {
                await this.runDialog(context, state);
            },
            true);
    }

    /**
     * Signs in a user.
     * @remarks
     * This method will be called automatically by the Application class.
     * @param context Current turn context.
     * @param state Application state.
     * @returns The authentication token or undefined if the user is still login in.
     */
    public async signInUser(context: TurnContext, state: TState): Promise<string|undefined> {
        const results = await this.runDialog(context, state);
        if (results.status === DialogTurnStatus.complete) {
            return results.result;
        } else {
            return undefined;
        }
    }

    /**
     * Signs out a user.
     * @param context Current turn context.
     */
    public signOutUser(context: TurnContext): Promise<void> {
        return this._oauthPrompt.signOutUser(context);
    }

    /**
     * @private
     */
    private async runDialog(context: TurnContext, state: TState): Promise<DialogTurnResult<string>> {
        const accessor = new TurnStateProperty<DialogState>(state, MEMORY_SCOPE, DIALOG_STATE_PROPERTY);
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this._oauthPrompt);
        const dialogContext = await dialogSet.createContext(context);
        let results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            results = await dialogContext.beginDialog(this._oauthPrompt.id);
        }
        return results;
    }
}


