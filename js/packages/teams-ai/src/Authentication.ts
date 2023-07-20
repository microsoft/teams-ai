/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ActivityTypes,
    InvokeResponse,
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
    OAuthPromptSettings,
    WaterfallDialog
} from 'botbuilder-dialogs';
import { TurnState } from './TurnState';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { TurnStateProperty } from './TurnStateProperty';
import { Application } from './Application';
import { SsoPrompt } from './Sso/SsoPrompt';
import { SsoPromptSettings } from './Sso/SsoPromptSettings';
import { AuthDialog } from './Sso/AuthDialog';

const promptName = "prompt";

/**
 * Authentication service.
 */
export class Authentication<TState extends TurnState = DefaultTurnState> {
    private readonly _prompt: OAuthPrompt | SsoPrompt;

    /**
     * Creates a new instance of the `Authentication` class.
     * @param app Application for adding routes.
     * @param settings Authentication settings.
     */
    constructor(app: Application<TState>, settings: OAuthPromptSettings | SsoPromptSettings) {
        // Create OAuthPrompt
        if ((settings as SsoPromptSettings).scopes) {
          this._prompt = new SsoPrompt(promptName, settings as SsoPromptSettings, (settings as SsoPromptSettings).initialLoginEndpoint);
        } else {
          this._prompt = new OAuthPrompt(promptName, settings as OAuthPromptSettings);
        }

        // Add application routes to handle OAuth callbacks
        app.addRoute(
            (context) => Promise.resolve(context.activity.type === ActivityTypes.Event && context.activity.name === tokenResponseEventName),
            async (context, state) => {
                const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
                await this.runDialog(context, state, userDialogStatePropertyName);
            },
            false);
        app.addRoute(
            (context) => Promise.resolve(context.activity.type === ActivityTypes.Invoke && context.activity.name === verifyStateOperationName),
            async (context, state) => {
                const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
                const userAuthStatePropertyName = this.getUserAuthStatePropertyName(context);
                let results = await this.runDialog(context, state, userDialogStatePropertyName);
                if (results.status === DialogTurnStatus.complete) {
                  // Get user auth state
                  const userAuthState = state.conversation.value[userAuthStatePropertyName] as UserAuthState;
                  if (!userAuthState.signedIn && userAuthState.message) {
                      // Restore user message
                      context.activity.text = userAuthState.message;
                      userAuthState.signedIn = true;
                      delete userAuthState.message;
                      state.conversation.value[userAuthStatePropertyName] = userAuthState;
                  }
      
                  // Delete persisted dialog state
                  delete state.conversation.value[userDialogStatePropertyName];
            }
          },
          true);
        app.addRoute(
            (context) => Promise.resolve(context.activity.type === ActivityTypes.Invoke && context.activity.name === tokenExchangeOperationName),
            async (context, state) => {
                const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
                const userAuthStatePropertyName = this.getUserAuthStatePropertyName(context);
                let results = await this.runDialog(context, state, userDialogStatePropertyName);
                if (results.status === DialogTurnStatus.complete) {
                  // Get user auth state
                  const userAuthState = state.conversation.value[userAuthStatePropertyName] as UserAuthState;
                  if (!userAuthState.signedIn && userAuthState.message) {
                      // Restore user message
                      context.activity.text = userAuthState.message;
                      userAuthState.signedIn = true;
                      delete userAuthState.message;
                      state.conversation.value[userAuthStatePropertyName] = userAuthState;
                  }
                  const token = results.result?.token;
      
                  // Delete persisted dialog state
                  delete state.conversation.value[userDialogStatePropertyName];
              }
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
        // Get property names to use
        const userAuthStatePropertyName = this.getUserAuthStatePropertyName(context);
        const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);

        // Save message if not signed in
        if (!state.conversation.value[userAuthStatePropertyName]) {
            state.conversation.value[userAuthStatePropertyName] = { signedIn: false, message: context.activity.text };
        }

        const results = await this.runDialog(context, state, userDialogStatePropertyName);
        if (results.status === DialogTurnStatus.complete) {
            // Get user auth state
            const userAuthState = state.conversation.value[userAuthStatePropertyName] as UserAuthState;
            if (!userAuthState.signedIn && userAuthState.message) {
                // Restore user message
                context.activity.text = userAuthState.message;
                userAuthState.signedIn = true;
                delete userAuthState.message;
                state.conversation.value[userAuthStatePropertyName] = userAuthState;
            }

            // Delete persisted dialog state
            delete state.conversation.value[userDialogStatePropertyName];

            // Return token
            return results.result?.token;
        } else {
            return undefined;
        }
    }

    /**
     * Signs out a user.
     * @param context Current turn context.
     */
    public signOutUser(context: TurnContext, state: TState): Promise<void> {
        // Delete user auth state
        const userAuthStatePropertyName = this.getUserAuthStatePropertyName(context);
        if (state.conversation.value[userAuthStatePropertyName]) {
            delete state.conversation.value[userAuthStatePropertyName];
        }

        // Delete user dialog state
        const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
        if (state.conversation.value[userDialogStatePropertyName]) {
            delete state.conversation.value[userDialogStatePropertyName];
        }

        return (this._prompt as OAuthPrompt).signOutUser(context);
    }

    /**
     * @private
     */
    private getUserAuthStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:AuthState__`;
    }

    /**
     * @private
     */
    private getUserDialogStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:DialogState__`;
    }

    /**
     * @private
     */
    private async runDialog(context: TurnContext, state: TState, dialogStateProperty: string): Promise<DialogTurnResult<OAuthPromptResult>> {
        // Save the
        const accessor = new TurnStateProperty<DialogState>(state, 'conversation', dialogStateProperty);
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this._prompt);
        dialogSet.add(new WaterfallDialog('taskNeedingLogin', [
          async (step) => {
            return await step.beginDialog(promptName);
          },
          async (step) => {
            const token = step.result;
            if (token) {
              await step.context.sendActivity(`You are now logged in.`);
              await step.context.sendActivity(token.token);
              return await step.endDialog();
            } else {
              await step.context.sendActivity(`Sorry... We couldn't log you in. Try again later.`);
              return await step.endDialog();
            }
          }
        ]));
        const dialogContext = await dialogSet.createContext(context);
        let results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            results = await dialogContext.beginDialog('taskNeedingLogin');
        }
        return results;
    }
}

/**
 * @private
 */
interface OAuthPromptResult {
    connectionName: string;
    token: string;
}

/**
 * @private
 */
interface UserAuthState {
    signedIn: boolean;
    message?: string;
}