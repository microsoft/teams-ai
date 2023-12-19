// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    DialogContext,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus,
    OAuthPrompt,
    OAuthPromptSettings
} from 'botbuilder-dialogs';
import { Storage, TeamsSSOTokenExchangeMiddleware, TurnContext, TokenResponse } from 'botbuilder';
import { BotAuthenticationBase } from './BotAuthenticationBase';
import { Application } from '../Application';
import { TurnState } from '../TurnState';
import { TurnStateProperty } from '../TurnStateProperty';

/**
 * @internal
 *
 * Handles authentication for Teams bots.
 * @template TState - The type of the turn state object.
 */
export class OAuthBotAuthentication<TState extends TurnState> extends BotAuthenticationBase<TState> {
    private _oauthPrompt: OAuthPrompt;

    /**
     * Initializes a new instance of the OAuthBotAuthentication class.
     * @param app - The application object.
     * @param oauthPromptSettings - The settings for OAuthPrompt.
     * @param settingName - The name of the setting.
     * @param storage - The storage object for storing state.
     */
    public constructor(
        app: Application<TState>,
        oauthPromptSettings: OAuthPromptSettings, // Child classes will have different types for this
        settingName: string,
        storage?: Storage
    ) {
        super(app, settingName, storage);

        // Create OAuthPrompt
        this._oauthPrompt = new OAuthPrompt('OAuthPrompt', oauthPromptSettings);

        // Handles deduplication of token exchange event when using SSO with Bot Authentication
        app.adapter.use(new FilteredTeamsSSOTokenExchangeMiddleware(this._storage, oauthPromptSettings.connectionName));
    }

    /**
     * Run or continue the OAuthPrompt dialog and returns the result.
     * @param context - The turn context object.
     * @param state - The turn state object.
     * @param dialogStateProperty - The name of the dialog state property.
     * @returns A promise that resolves to the dialog turn result containing the token response.
     */
    public async runDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<TokenResponse>> {
        const dialogContext = await this.createDialogContext(context, state, dialogStateProperty);
        let results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            results = await dialogContext.beginDialog(this._oauthPrompt.id);
        }
        return results;
    }

    /**
     * Continue the OAuthPrompt dialog and returns the result.
     * @param context - The turn context object.
     * @param state - The turn state object.
     * @param dialogStateProperty - The name of the dialog state property.
     * @returns A promise that resolves to the dialog turn result containing the token response.
     */
    public async continueDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<TokenResponse>> {
        const dialogContext = await this.createDialogContext(context, state, dialogStateProperty);
        return await dialogContext.continueDialog();
    }

    /**
     * Creates a new DialogContext for OAuthPrompt.
     * @param context - The turn context object.
     * @param state - The turn state object.
     * @param dialogStateProperty - The name of the dialog state property.
     * @returns A promise that resolves to the dialog context.
     */
    private async createDialogContext(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogContext> {
        const accessor = new TurnStateProperty<DialogState>(state, 'conversation', dialogStateProperty);
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this._oauthPrompt);
        return await dialogSet.createContext(context);
    }
}

/**
 * @internal
 * SSO Token Exchange Middleware for Teams that filters based on the connection name.
 */
export class FilteredTeamsSSOTokenExchangeMiddleware extends TeamsSSOTokenExchangeMiddleware {
    private readonly _oauthConnectionName: string;

    public constructor(storage: Storage, oauthConnectionName: string) {
        super(storage, oauthConnectionName);
        this._oauthConnectionName = oauthConnectionName;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        // If connection name matches then continue to the Teams SSO Token Exchange Middleware.
        if (context.activity.value?.connectionName == this._oauthConnectionName) {
            await super.onTurn(context, next);
        } else {
            await next();
        }
    }
}
