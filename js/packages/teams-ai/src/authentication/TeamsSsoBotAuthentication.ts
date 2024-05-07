// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ActivityTypes, Storage, TokenResponse, TurnContext, tokenExchangeOperationName } from 'botbuilder';
import {
    Dialog,
    DialogContext,
    DialogTurnStatus,
    DialogSet,
    DialogState,
    DialogTurnResult,
    WaterfallDialog
} from 'botbuilder-dialogs';
import { Application } from '../Application';
import { TurnState } from '../TurnState';
import { BotAuthenticationBase } from './BotAuthenticationBase';
import { TeamsSsoPrompt } from './TeamsBotSsoPrompt';
import { TurnStateProperty } from '../TurnStateProperty';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { TeamsSsoSettings } from './TeamsSsoSettings';

const SSO_DIALOG_ID = '_TeamsSsoDialog';

/**
 * @internal
 *
 * Handles authentication for Teams bots using Single Sign-On (SSO).
 * @template TState - The type of the turn state object.
 */
export class TeamsSsoBotAuthentication<TState extends TurnState> extends BotAuthenticationBase<TState> {
    private _prompt: TeamsSsoPrompt;
    private _tokenExchangeIdRegex: RegExp;

    /**
     * Initializes a new instance of the TeamsSsoBotAuthentication class.
     * @param {Application<TState>} app - The application object.
     * @param {TeamsSsoSettings} settings - The settings for Teams SSO.
     * @param {string} settingName - The name of the setting.
     * @param {ConfidentialClientApplication} msal - The MSAL (Microsoft Authentication Library) object.
     * @param {Storage} storage - The storage object for storing state.
     */
    public constructor(
        app: Application<TState>,
        settings: TeamsSsoSettings,
        settingName: string,
        msal: ConfidentialClientApplication,
        storage?: Storage
    ) {
        super(app, settingName, storage);

        this._prompt = new TeamsSsoPrompt('TeamsSsoPrompt', settingName, settings, msal);
        this._tokenExchangeIdRegex = new RegExp(
            `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-${this._settingName}`
        );

        // Do not save state for duplicate token exchange events to avoid eTag conflicts
        app.turn('afterTurn', async (context, state) => {
            return state.temp.duplicateTokenExchange !== true;
        });
    }

    /**
     * Run or continue the SSO dialog and returns the result.
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
        const dialogContext = await this.createSsoDialogContext(context, state, dialogStateProperty);
        let results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            results = await dialogContext.beginDialog(SSO_DIALOG_ID);
        }
        return results;
    }

    /**
     * Continues the SSO dialog and returns the result.
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
        const dialogContext = await this.createSsoDialogContext(context, state, dialogStateProperty);
        return await dialogContext.continueDialog();
    }

    /**
     * Determines whether the token exchange activity should be processed by current authentication setting.
     * @param {TurnContext} context - The turn context object.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the token exchange route should be processed by current class instance.
     */
    public async tokenExchangeRouteSelector(context: TurnContext): Promise<boolean> {
        return (
            (await super.tokenExchangeRouteSelector(context)) &&
            this._tokenExchangeIdRegex.test(context.activity.value.id)
        );
    }

    /**
     * Creates the SSO dialog context.
     * @param {TurnContext} context - The turn context object.
     * @param {TState} state - The turn state object.
     * @param {string} dialogStateProperty - The name of the dialog state property.
     * @returns {Promise<DialogContext>} A promise that resolves to the dialog context object.
     */
    private async createSsoDialogContext(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogContext> {
        const accessor = new TurnStateProperty<DialogState>(state, 'conversation', dialogStateProperty);
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this._prompt);
        dialogSet.add(
            new WaterfallDialog(SSO_DIALOG_ID, [
                async (step) => {
                    return await step.beginDialog(this._prompt.id);
                },
                async (step) => {
                    const tokenResponse = step.result;
                    // Dedup token exchange responses
                    if (tokenResponse && (await this.shouldDedup(context))) {
                        state.temp.duplicateTokenExchange = true;
                        return Dialog.EndOfTurn;
                    }
                    return await step.endDialog(step.result);
                }
            ])
        );
        return await dialogSet.createContext(context);
    }

    /**
     * Checks if deduplication should be performed for token exchange.
     * @param {TurnContext} context - The turn context object.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether deduplication should be performed.
     */
    private async shouldDedup(context: TurnContext): Promise<boolean> {
        const storeItem = {
            eTag: context.activity.value.id
        };

        const key = this.getStorageKey(context);
        const storeItems = { [key]: storeItem };

        try {
            await this._storage.write(storeItems);
        } catch (err) {
            if (err instanceof Error && err.message.indexOf('eTag conflict')) {
                return true;
            }
            throw err;
        }
        return false;
    }

    /**
     * Gets the storage key for storing the token exchange state.
     * @param {TurnContext} context - The turn context object.
     * @returns {string} The storage key.
     * @throws Error if the context is invalid or the activity is not a token exchange invoke.
     */
    private getStorageKey(context: TurnContext): string {
        if (!context || !context.activity || !context.activity.conversation) {
            throw new Error('Invalid context, can not get storage key!');
        }
        const activity = context.activity;
        const channelId = activity.channelId;
        const conversationId = activity.conversation.id;
        if (activity.type !== ActivityTypes.Invoke || activity.name !== tokenExchangeOperationName) {
            throw new Error('TokenExchangeState can only be used with Invokes of signin/tokenExchange.');
        }
        const value = activity.value;
        if (!value || !value.id) {
            throw new Error('Invalid signin/tokenExchange. Missing activity.value.id.');
        }
        return `${channelId}/${conversationId}/${value.id}`;
    }
}
