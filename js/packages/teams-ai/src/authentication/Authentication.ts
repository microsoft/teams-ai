/* eslint-disable security/detect-object-injection */
/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage, TurnContext } from 'botbuilder';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { TurnState } from '../TurnState';
import { DefaultTurnState } from '../DefaultTurnStateManager';
import { Application, Selector } from '../Application';
import { MessagingExtensionAuthentication } from './MessagingExtensionAuthentication';
import { BotAuthentication, deleteTokenFromState, setTokenInState } from './BotAuthentication';
import * as UserTokenAccess from './UserTokenAccess';

/**
 * User authentication service.
 */
export class Authentication<TState extends TurnState = DefaultTurnState> {
    private readonly _messagingExtensionAuth: MessagingExtensionAuthentication;
    private readonly _botAuth: BotAuthentication<TState>;
    private readonly _name: string;

    public readonly settings: OAuthPromptSettings;

    /**
     * Creates a new instance of the `Authentication` class.
     * @param {Application} app - The application instance.
     * @param {string} name - The name of the connection.
     * @param {OAuthPromptSettings} settings - Authentication settings.
     * @param {Storage} storage - A storage instance otherwise Memory Storage is used.
     * @param {MessagingExtensionAuthentication} messagingExtensionsAuth - Handles messaging extension flow authentication.
     * @param {BotAuthentication} botAuth - Handles bot-flow authentication.
     */
    constructor(
        app: Application<TState>,
        name: string,
        settings: OAuthPromptSettings,
        storage?: Storage,
        messagingExtensionsAuth?: MessagingExtensionAuthentication,
        botAuth?: BotAuthentication<TState>
    ) {
        this.settings = settings;
        this._name = name;
        this._messagingExtensionAuth = messagingExtensionsAuth || new MessagingExtensionAuthentication();
        this._botAuth = botAuth || new BotAuthentication(app, settings, this._name, storage);
    }

    /**
     * Signs in a user.
     *
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

        if (this._messagingExtensionAuth.isValidActivity(context)) {
            return await this._messagingExtensionAuth.authenticate(context, this.settings);
        }

        if (this._botAuth.isValidActivity(context)) {
            return await this._botAuth.authenticate(context, state);
        }

        throw new AuthError(
            'Incomming activity is not a valid activity to initiate authentication flow.',
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
    public signOutUser(context: TurnContext, state: TState): Promise<void> {
        this._botAuth.deleteAuthFlowState(context, state);

        // Signout flow is agnostic of the activity type.
        return UserTokenAccess.signOutUser(context, this.settings);
    }

    /**
     * Check is the user is signed, if they are then returns the token.
     * @param {TurnContext} context Current turn context.
     * @returns {string | undefined} The token string or undefined if the user is not signed in.
     */
    public async isUserSignedIn(context: TurnContext): Promise<string | undefined> {
        const tokenResponse = await UserTokenAccess.getUserToken(context, this.settings, '');

        if (tokenResponse && tokenResponse.token) {
            return tokenResponse.token;
        }

        return undefined;
    }

    /**
     * The handler function is called when the user has successfully signed in.
     * This only applies if sign in was initiated by the user sending a message to the bot.
     * This handler will not be triggered if a messaging extension triggered the authentication flow.
     * @template TState
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler The handler function to call when the user has successfully signed in
     */
    public async onUserSignInSuccess(handler: (context: TurnContext, state: TState) => Promise<void>): Promise<void> {
        this._botAuth.onUserSignInSuccess(handler);
    }

    /**
     * This handler function is called when the user sign in flow fails.
     * This only applies if sign in was initiated by the user sending a message to the bot.
     * This handler will not be triggered if a messaging extension triggered the authentication flow.
     * @template TState
     * @param {(context: TurnContext, state: TState, error: AuthError) => Promise<void>} handler The handler function to call when the user failed to signed in.
     */
    public async onUserSignInFailure(
        handler: (context: TurnContext, state: TState, error: AuthError) => Promise<void>
    ) {
        this._botAuth.onUserSignInFailure(handler);
    }
}

/**
 * The user authentication manager.
 */
export class AuthenticationManager<TState extends TurnState = DefaultTurnState> {
    private readonly _authentications: Map<string, Authentication<TState>> = new Map<string, Authentication<TState>>();
    private readonly defaultSettingName: string;

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

        this.defaultSettingName = options.default || Object.keys(options.settings)[0];

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
            throw new Error(`Could not find setting name ${name}`);
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
            settingName = this.defaultSettingName;
        }

        // Get authentication instace
        const auth: Authentication<TState> = this.get(settingName);
        let status: 'pending' | 'complete' | 'error';

        // Sign the user in
        let token;
        try {
            // Get the auth token
            token = await auth.signInUser(context, state);
        } catch (e) {
            status = 'error';
            const reason = e instanceof AuthError ? e.reason : 'other';

            return {
                status: status,
                errorReason: reason,
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
            settingName = this.defaultSettingName;
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
 * The options to configure the authentication manager
 */
export interface AuthenticationOptions {
    /**
     * The authentication settings.
     * Key uniquely identifies the connection string.
     */
    settings: { [key: string]: OAuthPromptSettings };

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

export type SignInResponse = {
    status: 'pending' | 'complete' | 'error';
    error?: unknown;
    errorReason?: AuthErrorReason;
};

export class AuthError extends Error {
    public readonly reason: AuthErrorReason;

    constructor(message?: string, reason: AuthErrorReason = 'other') {
        super(message);
        this.reason = reason;
    }
}

export type AuthErrorReason = 'invalidActivity' | 'completionWithoutToken' | 'other';
export type SignInStatus = 'pending' | 'complete' | 'error';
