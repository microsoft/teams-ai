// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    DialogContext,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus,
    OAuthPrompt
} from 'botbuilder-dialogs';
import {
    Storage,
    TeamsSSOTokenExchangeMiddleware,
    TurnContext,
    TokenResponse,
    CardFactory,
    Attachment
} from 'botbuilder';
import { BotAuthenticationBase } from './BotAuthenticationBase';
import { Application } from '../Application';
import { TurnState } from '../TurnState';
import { TurnStateProperty } from '../TurnStateProperty';
import { OAuthSettings } from './Authentication';
import { getSignInResource } from './UserTokenAccess';

/**
 * @internal
 *
 * Handles authentication for Teams bots.
 * @template TState - The type of the turn state object.
 */
export class OAuthBotAuthentication<TState extends TurnState> extends BotAuthenticationBase<TState> {
    private _oauthPrompt: OAuthPrompt;
    private _oauthSettings: OAuthSettings;

    /**
     * Initializes a new instance of the OAuthBotAuthentication class.
     * @param {Application} app - The application object.
     * @param {OAuthSettings} oauthSettings - The settings for OAuthPrompt.
     * @param {string} settingName - The name of the setting.
     * @param {Storage} storage - The storage object for storing state.
     */
    public constructor(
        app: Application<TState>,
        oauthSettings: OAuthSettings, // Child classes will have different types for this
        settingName: string,
        storage?: Storage
    ) {
        super(app, settingName, storage);

        // Create OAuthPrompt
        this._oauthPrompt = new OAuthPrompt('OAuthPrompt', oauthSettings);
        this._oauthSettings = oauthSettings;

        // Handles deduplication of token exchange event when using SSO with Bot Authentication
        app.adapter.use(new FilteredTeamsSSOTokenExchangeMiddleware(this._storage, oauthSettings.connectionName));
    }

    /**
     * Run or continue the OAuthPrompt dialog and returns the result.
     * @param {TurnContext} context - The turn context object.
     * @param {TState} state - The turn state object.
     * @param {string} dialogStateProperty - The name of the dialog state property.
     * @returns {Promise<DialogTurnResult<TokenResponse>>} A promise that resolves to the dialog turn result containing the token response.
     */
    public async runDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<TokenResponse>> {
        const dialogContext = await this.createDialogContext(context, state, dialogStateProperty);
        let results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            const card = await this.createOAuthCard(context);
            results = await dialogContext.beginDialog(this._oauthPrompt.id, {
                prompt: {
                    attachments: [card]
                }
            });
        }
        return results;
    }

    /**
     * Continue the OAuthPrompt dialog and returns the result.
     * @param {TurnContext} context - The turn context object.
     * @param {TState} state - The turn state object.
     * @param {string} dialogStateProperty - The name of the dialog state property.
     * @returns {Promise<DialogTurnResult<TokenResponse>>} A promise that resolves to the dialog turn result containing the token response.
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
     * @param {TurnContext} context - The turn context object.
     * @param {TState} state - The turn state object.
     * @param {string} dialogStateProperty - The name of the dialog state property.
     * @returns {Promise<DialogContext>} A promise that resolves to the dialog context.
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

    /**
     * Creates an OAuthCard that will be sent to the user.
     * @param {TurnContext} context - The turn context.
     * @returns {Promise<Attachment>} The OAuthCard.
     */
    private async createOAuthCard(context: TurnContext): Promise<Attachment> {
        const signInResource = await getSignInResource(context, this._oauthSettings);
        let link = signInResource.signInLink;
        let tokenExchangeResource;

        if (this._oauthSettings.enableSso == true) {
            tokenExchangeResource = signInResource.tokenExchangeResource;
            link = undefined;
        }

        return CardFactory.oauthCard(
            this._oauthSettings.connectionName,
            this._oauthSettings.title,
            this._oauthSettings.text,
            link,
            tokenExchangeResource,
            signInResource.tokenPostResource
        );
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
