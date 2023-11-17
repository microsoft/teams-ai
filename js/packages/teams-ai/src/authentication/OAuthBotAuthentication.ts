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

export class OAuthBotAuthentication<TState extends TurnState> extends BotAuthenticationBase<TState> {
    private _oauthPrompt: OAuthPrompt;

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

    public async continueDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<TokenResponse>> {
        const dialogContext = await this.createDialogContext(context, state, dialogStateProperty);
        return await dialogContext.continueDialog();
    }

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
class FilteredTeamsSSOTokenExchangeMiddleware extends TeamsSSOTokenExchangeMiddleware {
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
