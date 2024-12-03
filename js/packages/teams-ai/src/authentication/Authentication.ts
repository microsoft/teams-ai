/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { type AuthenticationResult, ConfidentialClientApplication } from '@azure/msal-node';
import { Storage, TurnContext } from 'botbuilder';
import { OAuthPromptSettings } from 'botbuilder-dialogs';

import { Application, Selector } from '../Application';
import { TurnState } from '../TurnState';

import { AdaptiveCardAuthenticationBase } from './AdaptiveCardAuthenticationBase';
import { BotAuthenticationBase, deleteTokenFromState, setTokenInState } from './BotAuthenticationBase';
import { MessageExtensionAuthenticationBase } from './MessageExtensionAuthenticationBase';
import { OAuthAdaptiveCardAuthentication } from './OAuthAdaptiveCardAuthentication';
import { OAuthBotAuthentication } from './OAuthBotAuthentication';
import { OAuthPromptMessageExtensionAuthentication } from './OAuthMessageExtensionAuthentication';
import { TeamsSsoAdaptiveCardAuthentication } from './TeamsSsoAdaptiveCardAuthentication';
import { TeamsSsoBotAuthentication } from './TeamsSsoBotAuthentication';
import { TeamsSsoMessageExtensionAuthentication } from './TeamsSsoMessageExtensionAuthentication';
import { TeamsSsoSettings } from './TeamsSsoSettings';
import * as UserTokenAccess from './UserTokenAccess';

/**
 * User authentication service.
 */
export class Authentication<TState extends TurnState> {
    private readonly _adaptiveCardAuth: AdaptiveCardAuthenticationBase;
    private readonly _messageExtensionAuth: MessageExtensionAuthenticationBase;
    private readonly _botAuth: BotAuthenticationBase<TState>;
    private readonly _name: string;
    private readonly _msal?: ConfidentialClientApplication;

    /**
     * The authentication settings.
     */
    public readonly settings: OAuthSettings | TeamsSsoSettings;

    /**
     * Creates a new instance of the `Authentication` class.
     * @param {Application} app - The application instance.
     * @param {string} name - The name of the connection.
     * @param {OAuthSettings} settings - Authentication settings.
     * @param {Storage} storage - A storage instance otherwise Memory Storage is used.
     * @param {MessageExtensionAuthenticationBase} messageExtensionsAuth - Handles message extension flow authentication.
     * @param {BotAuthenticationBase} botAuth - Handles bot-flow authentication.
     * @param {AdaptiveCardAuthenticationBase} adaptiveCardAuth - Handles adaptive card authentication.
     */
    constructor(
        app: Application<TState>,
        name: string,
        settings: OAuthSettings | TeamsSsoSettings,
        storage?: Storage,
        messageExtensionsAuth?: MessageExtensionAuthenticationBase,
        botAuth?: BotAuthenticationBase<TState>,
        adaptiveCardAuth?: AdaptiveCardAuthenticationBase
    ) {
        this.settings = settings;
        this._name = name;

        if (this.isOAuthSettings(settings)) {
            this._messageExtensionAuth =
                messageExtensionsAuth || new OAuthPromptMessageExtensionAuthentication(settings);
            this._botAuth = botAuth || new OAuthBotAuthentication(app, settings, this._name, storage);
            this._adaptiveCardAuth = adaptiveCardAuth || new OAuthAdaptiveCardAuthentication(settings);
        } else {
            this._msal = new ConfidentialClientApplication(settings.msalConfig);
            this._botAuth = botAuth || new TeamsSsoBotAuthentication(app, settings, this._name, this._msal, storage);
            this._messageExtensionAuth =
                messageExtensionsAuth || new TeamsSsoMessageExtensionAuthentication(settings, this._msal);
            this._adaptiveCardAuth = adaptiveCardAuth || new TeamsSsoAdaptiveCardAuthentication();
        }
    }

    /**
     * Signs in a user.
     * This method will be called automatically by the Application class.
     * @template TState
     * @param {TurnContext} context - Current turn context.
     * @param {TState} state Application state.
     * @returns {string | undefined} The authentication token or undefined if the user is still login in.
     */
    public async signInUser(context: TurnContext, state: TState): Promise<string | undefined> {
        // Check if user is signed in.
        const token = await this.isUserSignedIn(context);
        if (token) {
            return token;
        }

        if (this._messageExtensionAuth.isValidActivity(context)) {
            return await this._messageExtensionAuth.authenticate(context);
        }

        if (this._botAuth.isValidActivity(context)) {
            return await this._botAuth.authenticate(context, state);
        }

        if (this._adaptiveCardAuth.isValidActivity(context)) {
            return await this._adaptiveCardAuth.authenticate(context);
        }

        throw new AuthError(
            'Incoming activity is not a valid activity to initiate authentication flow.',
            'invalidActivity'
        );
    }

    /**
     * Signs out a user.
     * @template TState
     * @param {TurnContext} context - Current turn context.
     * @param {TState} state - Application state.
     * @returns {Promise<void>} A Promise representing the asynchronous operation.
     */
    public async signOutUser(context: TurnContext, state: TState): Promise<void> {
        this._botAuth.deleteAuthFlowState(context, state);

        // Signout flow is agnostic of the activity type.
        if (this.isOAuthSettings(this.settings)) {
            return await UserTokenAccess.signOutUser(context, this.settings);
        } else {
            return await this.removeTokenFromMsalCache(context);
        }
    }

    /**
     * Check if the user is signed, if they are then return the token.
     * @param {TurnContext} context Current turn context.
     * @returns {string | undefined} The token string or undefined if the user is not signed in.
     */
    public async isUserSignedIn(context: TurnContext): Promise<string | undefined> {
        if (this.isOAuthSettings(this.settings)) {
            const tokenResponse = await UserTokenAccess.getUserToken(context, this.settings, '');

            if (tokenResponse && tokenResponse.token) {
                return tokenResponse.token;
            }

            return undefined;
        } else {
            const tokenResponse = await this.acquireTokenFromMsalCache(context);

            if (tokenResponse && tokenResponse.accessToken) {
                return tokenResponse.accessToken;
            }

            return undefined;
        }
    }

    /**
     * The handler function is called when the user has successfully signed in.
     * This only applies if sign in was initiated by the user sending a message to the bot.
     * This handler will not be triggered if a message extension triggered the authentication flow.
     * @template TState
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler The handler function to call when the user has successfully signed in
     */
    public onUserSignInSuccess(handler: (context: TurnContext, state: TState) => Promise<void>) {
        this._botAuth.onUserSignInSuccess(handler);
    }

    /**
     * This handler function is called when the user sign in flow fails.
     * This only applies if sign in was initiated by the user sending a message to the bot.
     * This handler will not be triggered if a message extension triggered the authentication flow.
     * @template TState
     * @param {(context: TurnContext, state: TState, error: AuthError) => Promise<void>} handler The handler function to call when the user failed to signed in.
     */
    public onUserSignInFailure(handler: (context: TurnContext, state: TState, error: AuthError) => Promise<void>) {
        this._botAuth.onUserSignInFailure(handler);
    }

    private isOAuthSettings(settings: OAuthSettings | TeamsSsoSettings): settings is OAuthSettings {
        return (settings as OAuthSettings).connectionName !== undefined;
    }

    private async acquireTokenFromMsalCache(context: TurnContext): Promise<AuthenticationResult | null> {
        try {
            if (context.activity.from.aadObjectId) {
                const settings = this.settings as TeamsSsoSettings;
                const account = await this._msal!.getTokenCache().getAccountByLocalId(
                    context.activity.from.aadObjectId
                );
                if (account) {
                    const silentRequest = {
                        account: account,
                        scopes: settings.scopes
                    };
                    return await this._msal!.acquireTokenSilent(silentRequest);
                }
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    private async removeTokenFromMsalCache(context: TurnContext): Promise<void> {
        if (context.activity.from.aadObjectId) {
            try {
                const account = await this._msal!.getTokenCache().getAccountByLocalId(
                    context.activity.from.aadObjectId
                );
                if (account) {
                    await this._msal!.getTokenCache().removeAccount(account);
                }
            } catch (error) {
                return;
            }
        }
        return;
    }
}

/**
 * The user authentication manager.
 */
export class AuthenticationManager<TState extends TurnState> {
    private readonly _authentications: Map<string, Authentication<TState>> = new Map<string, Authentication<TState>>();
    public readonly default: string;

    /**
     * Creates a new instance of the `AuthenticationManager` class.
     * @param {Application} app - The application instance.
     * @param {AuthenticationOptions} options - Authentication options.
     * @param {Storage} storage - A storage instance otherwise Memory Storage is used.
     */
    constructor(app: Application<TState>, options: AuthenticationOptions, storage?: Storage) {
        if (!options.settings || Object.keys(options.settings).length === 0) {
            throw new Error('Authentication settings are required.');
        }

        this.default = options.default || Object.keys(options.settings)[0];

        const settings = options.settings;

        for (const key in settings) {
            if (key in settings) {
                const setting = settings[key];
                const authentication = new Authentication(app, key, setting, storage);

                this._authentications.set(key, authentication);
            }
        }
    }

    /**
     * @template TState
     * Gets the authentication instance for the specified connection name.
     * @param {string} name The setting name.
     * @returns {Authentication<TState>} The authentication instance.
     */
    public get(name: string): Authentication<TState> {
        const connection = this._authentications.get(name);

        if (!connection) {
            throw new Error(`Could not find setting name '${name}'`);
        }

        return connection;
    }

    /**
     * Signs in a user.
     * @template TState
     * @param {TurnContext} context The turn context.
     * @param {TState} state The turn state.
     * @param {string} settingName Optional. The name of the setting to use. If not specified, the default setting name is used.
     * @returns {Promise<SignInResponse>} The sign in response.
     */
    public async signUserIn(context: TurnContext, state: TState, settingName?: string): Promise<SignInResponse> {
        if (!settingName) {
            settingName = this.default;
        }

        // Get authentication instance
        const auth: Authentication<TState> = this.get(settingName);
        let status: 'pending' | 'complete' | 'error';

        // Sign the user in
        let token;
        try {
            // Get the auth token
            token = await auth.signInUser(context, state);
        } catch (e) {
            status = 'error';
            const cause = e instanceof AuthError ? e.cause : 'other';

            return {
                status: status,
                cause: cause,
                error: e
            };
        }

        if (token) {
            setTokenInState(state, settingName, token);
            status = 'complete';
        } else {
            status = 'pending';
        }

        return {
            status
        };
    }

    /**
     * Signs out a user.
     * @template TState
     * @param {TurnContext} context The turn context.
     * @param {TState} state The turn state.
     * @param {string} settingName Optional. The name of the setting to use. If not specified, the default setting name is used.
     */
    public async signOutUser(context: TurnContext, state: TState, settingName?: string): Promise<void> {
        if (!settingName) {
            settingName = this.default;
        }

        // Get authentication instace
        const auth: Authentication<TState> = this.get(settingName);

        // Sign the user out
        if (auth) {
            await auth.signOutUser(context, state);
            deleteTokenFromState(state, settingName);
        }
    }
}

/**
 * Settings used to configure user authentication through the OAuthPrompt.
 */
export type OAuthSettings = OAuthPromptSettings & {
    /**
     * Optional. Set this to enable SSO when authentication user using adaptive cards.
     */
    tokenExchangeUri?: string;

    /**
     * Optional. Set to `true` to enable SSO when authenticating using AAD.
     */
    enableSso?: boolean;
};

/**
 * The options to configure the authentication manager
 */
export interface AuthenticationOptions {
    /**
     * The authentication settings.
     * Key uniquely identifies the connection string.
     */
    settings: { [key: string]: OAuthSettings | TeamsSsoSettings };

    /**
     * Describes the setting the bot should use if the user does not specify a setting name.
     */
    default?: string;

    /**
     * Defaults to true.
     * Indicates whether the bot should start the sign in flow when the user sends a message to the bot or triggers a message extension.
     * If set to false, the bot will not start the sign in flow before routing the activity to the bot logic.
     *
     * To set custom logic, set this property to the selector function.
     */
    autoSignIn?: boolean | Selector;
}

/**
 * The sign in response.
 */
export type SignInResponse = {
    /**
     * The sign in status.
     */
    status: SignInStatus;

    /**
     * The error returned.
     */
    error?: unknown;

    /**
     * The cause of the error.
     */
    cause?: AuthErrorReason;
};

/**
 * An error thrown when an authentication error occurs.
 */
export class AuthError extends Error {
    /**
     * The cause of the error.
     */
    public readonly cause: AuthErrorReason;

    /**
     * Creates a new instance of the `AuthError` class.
     * @param {string} message The error message.
     * @param {AuthErrorReason} reason Optional. Cause of the error. Defaults to `other`.
     */
    constructor(message?: string, reason: AuthErrorReason = 'other') {
        super(message);
        this.cause = reason;
    }
}

/**
 * Cause of an authentication error.
 * @remarks
 * `invalidActivity` - The activity is not a valid activity to initiate authentication flow.
 * `completionWithoutToken` - The authentication flow completed without a token.
 * `other` - Other error.
 */
export type AuthErrorReason = 'invalidActivity' | 'completionWithoutToken' | 'other';

/**
 * The sign in status.
 * @remarks
 * `pending` - The user is not signed in and the bot has initiated the sign in flow.
 * `complete` - The user has successfully signed in.
 * `error` - An error occurred while signing the user in.
 */
export type SignInStatus = 'pending' | 'complete' | 'error';
