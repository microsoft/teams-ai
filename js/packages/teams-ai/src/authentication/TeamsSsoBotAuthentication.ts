// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ActivityTypes, Storage, TokenResponse, TurnContext, tokenExchangeOperationName } from "botbuilder";
import { Dialog, DialogContext, DialogTurnStatus } from "botbuilder-dialogs";
import { Application } from "../Application";
import { TurnState } from "../TurnState";
import { BotAuthenticationBase } from "./BotAuthenticationBase";
import { TeamsSsoPrompt, TeamsSsoPromptSettings } from "./TeamsBotSsoPrompt";
import { DialogSet, DialogState, DialogTurnResult, WaterfallDialog } from "botbuilder-dialogs";
import { TurnStateProperty } from "../TurnStateProperty";
import { ConfidentialClientApplication } from "@azure/msal-node";

const SSO_DIALOG_ID = "_TeamsSsoDialog";

export class TeamsSsoBotAuthentication<TState extends TurnState> extends BotAuthenticationBase<TState> {
    private _prompt: TeamsSsoPrompt;
    private _tokenExchangeIdRegex: RegExp;

    public constructor(
        app: Application<TState>,
        promptSettings: TeamsSsoPromptSettings, // Child classes will have different types for this
        settingName: string,
        msal: ConfidentialClientApplication,
        storage?: Storage
    ) {
        super(app, settingName, storage);

        this._prompt = new TeamsSsoPrompt('TeamsSsoPrompt', settingName, promptSettings, msal);
        this._tokenExchangeIdRegex = new RegExp(`[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-${this._settingName}`);

        // Do not save state for duplicate token exchange events to avoid eTag conflicts
        app.turn("afterTurn", async (context, state) => {
            return state.temp.duplicateTokenExchange !== true;
        });
    }

    public async runDialog(context: TurnContext, state: TState, dialogStateProperty: string): Promise<DialogTurnResult<TokenResponse>> {
        const dialogContext = await this.createSsoDialogContext(context, state, dialogStateProperty);
        let results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            results = await dialogContext.beginDialog(SSO_DIALOG_ID);
        }
        return results;
    }

    public async continueDialog(context: TurnContext, state: TState, dialogStateProperty: string): Promise<DialogTurnResult<TokenResponse>> {
        const dialogContext = await this.createSsoDialogContext(context, state, dialogStateProperty);
        return await dialogContext.continueDialog();
    }

    protected async tokenExchangeRouteSelector(context: TurnContext): Promise<boolean> {
        return await super.tokenExchangeRouteSelector(context) && this._tokenExchangeIdRegex.test(context.activity.value.id);
    }

    private async createSsoDialogContext(context: TurnContext, state: TState, dialogStateProperty: string): Promise<DialogContext> {
        const accessor = new TurnStateProperty<DialogState>(state, 'conversation', dialogStateProperty);
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this._prompt);
        dialogSet.add(new WaterfallDialog(SSO_DIALOG_ID, [
            async (step) => {
                return await step.beginDialog(this._prompt.id);
            },
            async (step) => {
                const tokenResponse = step.result;
                // Dedup token exchange responses
                if (tokenResponse && await this.shouldDedup(context)) {
                    state.temp.duplicateTokenExchange = true
                    return Dialog.EndOfTurn;
                }
                return await step.endDialog(step.result);
            }
        ]));
        return await dialogSet.createContext(context);
    }

    private async shouldDedup(context: TurnContext): Promise<boolean> {
        const storeItem = {
            eTag: context.activity.value.id,
        };

        const key = this.getStorageKey(context);
        const storeItems = { [key]: storeItem };

        try {
            await this._storage.write(storeItems);
        } catch (err) {
            if (err instanceof Error && err.message.indexOf("eTag conflict")) {
                return true;
            }
            throw err;
        }
        return false;
    }

    private getStorageKey(context: TurnContext): string {
        if (!context || !context.activity || !context.activity.conversation) {
            throw new Error("Invalid context, can not get storage key!");
        }
        const activity = context.activity;
        const channelId = activity.channelId;
        const conversationId = activity.conversation.id;
        if (
            activity.type !== ActivityTypes.Invoke ||
            activity.name !== tokenExchangeOperationName
        ) {
            throw new Error(
                "TokenExchangeState can only be used with Invokes of signin/tokenExchange."
            );
        }
        const value = activity.value;
        if (!value || !value.id) {
            throw new Error(
                "Invalid signin/tokenExchange. Missing activity.value.id."
            );
        }
        return `${channelId}/${conversationId}/${value.id}`;
    }
}