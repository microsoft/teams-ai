/* eslint-disable security/detect-object-injection */
/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActivityTypes, Storage, TurnContext } from 'botbuilder';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { TurnState } from '../TurnState';
import { DefaultTurnState } from '../DefaultTurnStateManager';
import { Application } from '../Application';
import { MessagingExtensionAuthentication } from './MessagingExtensionAuthentication';
import { BotAuthentication } from './BotAuthentication';
import * as UserTokenAccess from './UserTokenAccess';

/**
 * Authentication service.
 */
export class Authentication<TState extends TurnState = DefaultTurnState> {
    private readonly _messagingExtensionAuth: MessagingExtensionAuthentication<TState>;
    private readonly _botAuth: BotAuthentication<TState>;
    private readonly _oauthPromptSettings: OAuthPromptSettings;

    /**
     * Creates a new instance of the `Authentication` class.
     * @param {Application} app - The application instance.
     * @param {OAuthPromptSettings} settings - Authentication settings.
     * @param {Storage} storage - A storage instance otherwise Memory Storage is used.
     * @param {MessagingExtensionAuthentication} messagingExtensionsAuth - Handles messaging extension flow authentication.
     * @param {BotAuthentication} botAuth - Handles bot-flow authentication.
     */
    constructor(
        app: Application<TState>,
        settings: OAuthPromptSettings,
        storage?: Storage,
        messagingExtensionsAuth?: MessagingExtensionAuthentication<TState>,
        botAuth?: BotAuthentication<TState>
    ) {
        this._oauthPromptSettings = settings;
        this._messagingExtensionAuth = messagingExtensionsAuth || new MessagingExtensionAuthentication(settings);
        this._botAuth = botAuth || new BotAuthentication(app, settings, storage);
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
        if (this.isMessagingExtensionAuthFlow(context)) {
            return await this._messagingExtensionAuth.authenticate(context, state);
        } else if (this.isBotAuthFlow(context)) {
            return await this._botAuth.authenticate(context, state);
        } else {
            throw new Error(`signInUser() is not supported for this activity type.`);
        }
    }

    /**
     * Signs out a user.
     * @template TState
     * @param {TurnContext} context - Current turn context.
     * @param {TState} state - Application state.
     * @returns {Promise<void>} A Promise representing the asynchronous operation.
     */
    public signOutUser(context: TurnContext, state: TState): Promise<void> {
        if (this.isBotAuthFlow(context)) {
            this._botAuth.deleteAuthFlowState(context, state);
        }

        // Signout flow is agnostic of the activity type.
        return UserTokenAccess.signOutUser(context, this._oauthPromptSettings);
    }

    /**
     * Determines whether user sign in is allowed for the incomming activity type.
     * @param {TurnContext} context - Current turn context.
     * @returns {boolean} true if the user can sign in for the incomming activity type, false otherwise.
     */
    public canSignInUser(context: TurnContext): boolean {
        return this.isBotAuthFlow(context) || this.isMessagingExtensionAuthFlow(context);
    }

    /**
     * The handler function is called when the user has successfully signed in.
     *
     * This only applies if sign in was initiated by the user sending a message to the bot.
     * This handler will not be triggered if a messaging extension triggered the authentication flow.
     * @template TState
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler The handler function to call when the user has successfully signed in
     */
    public async onUserSignIn(handler: (context: TurnContext, state: TState) => Promise<void>): Promise<void> {
        this._botAuth.onUserSignIn(handler);
    }

    private isBotAuthFlow(context: TurnContext): boolean {
        return context.activity.type == ActivityTypes.Message;
    }

    private isMessagingExtensionAuthFlow(context: TurnContext): boolean {
        return this._messagingExtensionAuth.isValidActivity(context);
    }
}
