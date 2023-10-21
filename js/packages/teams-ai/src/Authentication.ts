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
    MemoryStorage,
    SignInUrlResponse,
    Storage,
    TeamsSSOTokenExchangeMiddleware,
    TokenResponse,
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
import * as UserTokenAccess from './UserTokenAccess';
import { FETCH_TASK_INVOKE_NAME, QUERY_INVOKE_NAME, QUERY_LINK_INVOKE_NAME } from './MessageExtensions';

/**
 * Authentication service.
 */
export class Authentication<TState extends TurnState = DefaultTurnState> {
    private readonly _oauthPrompt: OAuthPrompt;
    private readonly _oAuthPromptSettings: OAuthPromptSettings;
    private readonly _storage: Storage;
    private _authSuccessHandler?: (context: TurnContext, state: TState) => Promise<void>;
    private _authFailureHandler?: (context: TurnContext, state: TState) => Promise<void>;

    /**
     * Creates a new instance of the `Authentication` class.
     * @param app Application for adding routes.
     * @param settings Authentication settings.
     * @param storage
     */
    constructor(app: Application<TState>, settings: OAuthPromptSettings, storage?: Storage) {
        // Create OAuthPrompt
        this._oAuthPromptSettings = settings;
        this._oauthPrompt = new OAuthPrompt('OAuthPrompt', settings);

        this._storage = storage || new MemoryStorage();

        // Handles deduplication of token exchange event when using SSO with Bot Authentication
        app.adapter.use(new TeamsSSOTokenExchangeMiddleware(this._storage, settings.connectionName));

        // Add application routes to handle OAuth callbacks
        app.addRoute(
            (context) =>
                Promise.resolve(
                    context.activity.type === ActivityTypes.Event && context.activity.name === tokenResponseEventName
                ),
            async (context, state) => {
                const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
                await this.runDialog(context, state, userDialogStatePropertyName);
            },
            false
        );
        app.addRoute(
            (context) =>
                Promise.resolve(
                    context.activity.type === ActivityTypes.Invoke && context.activity.name === verifyStateOperationName
                ),
            async (context, state) => {
                const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
                const result = await this.runDialog(context, state, userDialogStatePropertyName);

                if (result.status === DialogTurnStatus.complete) {
                    if (result.result?.token) {
                        // Populate the token in the temp state
                        state.temp.value.authToken = await this.signInUser(context, state);

                        await context.sendActivity({
                            value: { status: 200 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });

                        await this._authSuccessHandler?.(context, state);
                    } else {
                        await context.sendActivity({
                            value: { status: 400 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });

                        await this._authFailureHandler?.(context, state);
                    }
                }
            },
            true
        );
        app.addRoute(
            (context) =>
                Promise.resolve(
                    context.activity.type === ActivityTypes.Invoke &&
                        context.activity.name === tokenExchangeOperationName
                ),
            async (context, state) => {
                const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
                const result = await this.runDialog(context, state, userDialogStatePropertyName);

                if (result.status === DialogTurnStatus.complete) {
                    if (result.result?.token) {
                        // Populate the token in the temp state
                        state.temp.value.authToken = await this.signInUser(context, state);

                        await context.sendActivity({
                            value: { status: 200 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });

                        await this._authSuccessHandler?.(context, state);
                    } else {
                        await context.sendActivity({
                            value: { status: 400 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });

                        await this._authFailureHandler?.(context, state);
                    }
                }
            },
            true
        );
    }

    /**
     * Signs in a user.
     * @remarks
     * This method will be called automatically by the Application class.
     * @param context Current turn context.
     * @param state Application state.
     * @returns The authentication token or undefined if the user is still login in.
     */
    public async signInUser(context: TurnContext, state: TState): Promise<string | undefined> {
        if (this.isInvokeActivityThatAllowsAuthSignIn(context)) {
            // Do token exchange
            const authObj = context.activity.value.authentication;
            if (authObj && authObj.token) {
                // Message extension token exchange invoke activity
                const isTokenExchangable = await this.tokenIsExchangeable(context);
                if (!isTokenExchangable) {
                    await context.sendActivity({
                        value: { status: 412 } as InvokeResponse,
                        type: ActivityTypes.InvokeResponse
                    });

                    return undefined;
                }
            }

            // Messaging extension Auth flow
            const token = await this.authenticateMessageExtensions(context, state);

            if (!token) {
                // Sign in card is sent to user
                return undefined;
            }

            return token;
        } else {
            // Bot Auth Flow

            // Get property names to use
            const userAuthStatePropertyName = this.getUserAuthStatePropertyName(context);
            const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);

            // Save message if not signed in
            if (!state.conversation.value[userAuthStatePropertyName]) {
                state.conversation.value[userAuthStatePropertyName] = { signedIn: false, message: context.activity.text };
            }

            const results = await this.runDialog(context, state, userDialogStatePropertyName);
            if (results.status === DialogTurnStatus.complete && results.result != undefined) {
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
    }

    /**
     * Signs out a user.
     * @param context Current turn context.
     * @param state
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

        return this._oauthPrompt.signOutUser(context);
    }

    /**
     * The handler function is called when the user has successfully signed in
     * @param status 'success' or 'failure'
     * @param handler The handler function to call
     */
    public async onUserSignIn(
        status: 'success' | 'failure',
        handler: (context: TurnContext, state: TState) => Promise<void>
    ): Promise<void> {
        if ('success' === status) {
            this._authSuccessHandler = handler;
        } else if ('failure' === status) {
            this._authFailureHandler = handler;
        }
    }

    public isInvokeActivityThatAllowsAuthSignIn(context: TurnContext): boolean {
        return (
            context.activity.type == ActivityTypes.Invoke &&
            (context.activity.name == QUERY_INVOKE_NAME ||
                context.activity.name == FETCH_TASK_INVOKE_NAME ||
                context.activity.name == QUERY_LINK_INVOKE_NAME)
        );
    }

    private async authenticateMessageExtensions(context: TurnContext, state: TState): Promise<string | undefined> {
        const value = context.activity.value;

        // When the Bot Service Auth flow completes, the query.State will contain a magic code used for verification.
        const magicCode = value.state && Number.isInteger(Number(value.state)) ? value.state : '';

        const tokenResponse = await this.getUserToken(context, magicCode);

        if (!tokenResponse || !tokenResponse.token) {
            // There is no token, so the user has not signed in yet.
            // Retrieve the OAuth Sign in Link to use in the MessagingExtensionResult Suggested Actions

            const signInResource = await this.getSignInResource(context);
            const signInLink = signInResource.signInLink;
            // Do 'silentAuth' if this is a composeExtension/query request otherwise do normal `auth` flow.
            const authType = context.activity.name === QUERY_INVOKE_NAME ? 'silentAuth' : 'auth';

            const response = {
                composeExtension: {
                    type: authType,
                    suggestedActions: {
                        actions: [
                            {
                                type: 'openUrl',
                                value: signInLink,
                                title: 'Bot Service OAuth'
                            }
                        ]
                    }
                }
            };

            // Queue up invoke response
            await context.sendActivity({
                value: { body: response, status: 200 } as InvokeResponse,
                type: ActivityTypes.InvokeResponse
            });

            return;
        }

        return tokenResponse.token;
    }

    /**
     * @param context
     * @internal
     */
    public async tokenIsExchangeable(context: TurnContext) {
        let tokenExchangeResponse;
        try {
            tokenExchangeResponse = await this.exchangeToken(context);
        } catch (err) {
            // Ignore Exceptions
            // If token exchange failed for any reason, tokenExchangeResponse above stays null, and hence we send back a failure invoke response to the caller.
            console.log('tokenExchange error: ' + err);
        }
        if (!tokenExchangeResponse || !tokenExchangeResponse.token) {
            return false;
        }
        return true;
    }

    public async exchangeToken(context: TurnContext): Promise<TokenResponse | undefined> {
        const tokenExchangeRequest = context.activity.value.authentication;

        if (!tokenExchangeRequest || !tokenExchangeRequest.token) {
            return;
        }

        return await UserTokenAccess.exchangeToken(context, this._oAuthPromptSettings, tokenExchangeRequest);
    }

    public async getUserToken(context: TurnContext, magicCode: string): Promise<TokenResponse> {
        return await UserTokenAccess.getUserToken(context, this._oAuthPromptSettings, magicCode);
    }

    public async getSignInResource(context: TurnContext): Promise<SignInUrlResponse> {
        return await UserTokenAccess.getSignInResource(context, this._oAuthPromptSettings);
    }

    /**
     * @param context
     * @private
     */
    private getUserAuthStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:AuthState__`;
    }

    /**
     * @param context
     * @private
     */
    private getUserDialogStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:DialogState__`;
    }

    /**
     * @param context
     * @param state
     * @param dialogStateProperty
     * @private
     */
    private async runDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<OAuthPromptResult>> {
        // Save the
        const accessor = new TurnStateProperty<DialogState>(state, 'conversation', dialogStateProperty);
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
