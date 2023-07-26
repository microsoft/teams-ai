/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    ActionTypes,
    Activity,
    ActivityTypes,
    CardFactory,
    Channels,
    CoreAppCredentials,
    InputHints,
    MessageFactory,
    OAuthCard,
    OAuthLoginTimeoutKey,
    StatusCodes,
    TokenExchangeInvokeRequest,
    TokenResponse,
    TurnContext,
    tokenExchangeOperationName,
    tokenResponseEventName,
    verifyStateOperationName,
} from '@microsoft/teams-core';

import * as UserTokenAccess from './userTokenAccess';
import { ClaimsIdentity, JwtTokenValidation, SkillValidation } from 'botframework-connector';
import { Dialog, DialogTurnResult } from '../dialog';
import { DialogContext } from '../dialogContext';
import { PromptOptions, PromptRecognizerResult, PromptValidator } from './prompt';

/**
 * Response body returned for a token exchange invoke activity.
 */
class TokenExchangeInvokeResponse {
    id: string;
    connectionName: string;
    failureDetail: string;

    constructor(id: string, connectionName: string, failureDetail: string) {
        this.id = id;
        this.connectionName = connectionName;
        this.failureDetail = failureDetail;
    }
}

/**
 * Settings used to configure an `OAuthPrompt` instance.
 */
export interface OAuthPromptSettings {
    /**
     * AppCredentials for OAuth.
     */
    oAuthAppCredentials?: CoreAppCredentials;

    /**
     * Name of the OAuth connection being used.
     */
    connectionName: string;

    /**
     * Title of the cards signin button.
     */
    title: string;

    /**
     * (Optional) additional text to include on the signin card.
     */
    text?: string;

    /**
     * (Optional) number of milliseconds the prompt will wait for the user to authenticate.
     * Defaults to a value `900,000` (15 minutes.)
     */
    timeout?: number;

    /**
     * (Optional) value indicating whether the OAuthPrompt should end upon
     * receiving an invalid message.  Generally the OAuthPrompt will ignore
     * incoming messages from the user during the auth flow, if they are not related to the
     * auth flow.  This flag enables ending the OAuthPrompt rather than
     * ignoring the user's message.  Typically, this flag will be set to 'true', but is 'false'
     * by default for backwards compatibility.
     */
    endOnInvalidMessage?: boolean;

    /**
     * (Optional) value to force the display of a Sign In link overriding the default behavior.
     * True to display the SignInLink.
     */
    showSignInLink?: boolean;
}

/**
 * Creates a new prompt that asks the user to sign in using the Bot Frameworks Single Sign On (SSO)
 * service.
 *
 * @remarks
 * The prompt will attempt to retrieve the users current token and if the user isn't signed in, it
 * will send them an `OAuthCard` containing a button they can press to signin. Depending on the
 * channel, the user will be sent through one of two possible signin flows:
 *
 * - The automatic signin flow where once the user signs in and the SSO service will forward the bot
 * the users access token using either an `event` or `invoke` activity.
 * - The "magic code" flow where where once the user signs in they will be prompted by the SSO
 * service to send the bot a six digit code confirming their identity. This code will be sent as a
 * standard `message` activity.
 *
 * Both flows are automatically supported by the `OAuthPrompt` and the only thing you need to be
 * careful of is that you don't block the `event` and `invoke` activities that the prompt might
 * be waiting on.
 *
 * > [!NOTE]
 * > You should avoid persisting the access token with your bots other state. The Bot Frameworks
 * > SSO service will securely store the token on your behalf. If you store it in your bots state
 * > it could expire or be revoked in between turns.
 * >
 * > When calling the prompt from within a waterfall step you should use the token within the step
 * > following the prompt and then let the token go out of scope at the end of your function.
 *
 * #### Prompt Usage
 *
 * When used with your bots `DialogSet` you can simply add a new instance of the prompt as a named
 * dialog using `DialogSet.add()`. You can then start the prompt from a waterfall step using either
 * `DialogContext.beginDialog()` or `DialogContext.prompt()`. The user will be prompted to signin as
 * needed and their access token will be passed as an argument to the callers next waterfall step:
 *
 * ```JavaScript
 * const { ConversationState, MemoryStorage, OAuthLoginTimeoutMsValue } = require('botbuilder');
 * const { DialogSet, OAuthPrompt, WaterfallDialog } = require('botbuilder-dialogs');
 *
 * const convoState = new ConversationState(new MemoryStorage());
 * const dialogState = convoState.createProperty('dialogState');
 * const dialogs = new DialogSet(dialogState);
 *
 * dialogs.add(new OAuthPrompt('loginPrompt', {
 *    connectionName: 'GitConnection',
 *    title: 'Login To GitHub',
 *    timeout: OAuthLoginTimeoutMsValue   // User has 15 minutes to login
 * }));
 *
 * dialogs.add(new WaterfallDialog('taskNeedingLogin', [
 *      async (step) => {
 *          return await step.beginDialog('loginPrompt');
 *      },
 *      async (step) => {
 *          const token = step.result;
 *          if (token) {
 *
 *              // ... continue with task needing access token ...
 *
 *          } else {
 *              await step.context.sendActivity(`Sorry... We couldn't log you in. Try again later.`);
 *              return await step.endDialog();
 *          }
 *      }
 * ]));
 * ```
 */
export class OAuthPrompt extends Dialog {
    private readonly PersistedCaller: string = 'botbuilder-dialogs.caller';
    /**
     * Creates a new OAuthPrompt instance.
     *
     * @param dialogId Unique ID of the dialog within its parent `DialogSet` or `ComponentDialog`.
     * @param settings Settings used to configure the prompt.
     * @param validator (Optional) validator that will be called each time the user responds to the prompt.
     */
    constructor(
        dialogId: string,
        private settings: OAuthPromptSettings,
        private validator?: PromptValidator<TokenResponse>
    ) {
        super(dialogId);
    }

    /**
     * Called when a prompt dialog is pushed onto the dialog stack and is being activated.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current
     * turn of the conversation.
     * @param options Optional. [PromptOptions](xref:botbuilder-dialogs.PromptOptions),
     * additional information to pass to the prompt being started.
     * @returns A `Promise` representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the prompt is still
     * active after the turn has been processed by the prompt.
     */
    async beginDialog(dc: DialogContext, options?: PromptOptions): Promise<DialogTurnResult> {
        // Ensure prompts have input hint set
        const o: Partial<PromptOptions> = { ...options };
        if (o.prompt && typeof o.prompt === 'object' && typeof o.prompt.inputHint !== 'string') {
            o.prompt.inputHint = InputHints.AcceptingInput;
        }
        if (o.retryPrompt && typeof o.retryPrompt === 'object' && typeof o.retryPrompt.inputHint !== 'string') {
            o.retryPrompt.inputHint = InputHints.AcceptingInput;
        }

        // Initialize prompt state
        const timeout = typeof this.settings.timeout === 'number' ? this.settings.timeout : 900000;
        const state = dc.activeDialog!.state as OAuthPromptState;
        state.state = {};
        state.options = o;
        state.expires = new Date().getTime() + timeout;
        (state as Record<string,any>)[this.PersistedCaller] = OAuthPrompt.createCallerInfo(dc.context);

        // Attempt to get the users token
        const output = await UserTokenAccess.getUserToken(dc.context, this.settings, undefined as any);
        if (output) {
            // Return token
            return await dc.endDialog(output);
        }

        // Prompt user to login
        await OAuthPrompt.sendOAuthCard(this.settings, dc.context, state.options.prompt);
        return Dialog.EndOfTurn;
    }

    /**
     * Called when a prompt dialog is the active dialog and the user replied with a new activity.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn
     * of the conversation.
     * @returns A `Promise` representing the asynchronous operation.
     * @remarks
     * If the task is successful, the result indicates whether the dialog is still
     * active after the turn has been processed by the dialog.
     * The prompt generally continues to receive the user's replies until it accepts the
     * user's reply as valid input for the prompt.
     */
    async continueDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Check for timeout
        const state: OAuthPromptState = dc.activeDialog!.state as OAuthPromptState;
        const isMessage: boolean = dc.context.activity.type === ActivityTypes.Message;
        const isTimeoutActivityType: boolean =
            isMessage ||
            OAuthPrompt.isTokenResponseEvent(dc.context) ||
            OAuthPrompt.isTeamsVerificationInvoke(dc.context) ||
            OAuthPrompt.isTokenExchangeRequestInvoke(dc.context);

        // If the incoming Activity is a message, or an Activity Type normally handled by OAuthPrompt,
        // check to see if this OAuthPrompt Expiration has elapsed, and end the dialog if so.
        const hasTimedOut: boolean = isTimeoutActivityType && new Date().getTime() > state.expires;
        if (hasTimedOut) {
            return await dc.endDialog(undefined);
        } else {
            // Recognize token
            const recognized: PromptRecognizerResult<TokenResponse> = await this.recognizeToken(dc);

            if (state.state['attemptCount'] === undefined) {
                state.state['attemptCount'] = 0;
            }

            // Validate the return value
            let isValid = false;
            if (this.validator) {
                isValid = await this.validator({
                    context: dc.context,
                    recognized: recognized,
                    state: state.state,
                    options: state.options,
                    attemptCount: ++state.state['attemptCount'],
                });
            } else if (recognized.succeeded) {
                isValid = true;
            }

            // Return recognized value or re-prompt
            if (isValid) {
                return await dc.endDialog(recognized.value);
            }

            if (isMessage && this.settings.endOnInvalidMessage) {
                return await dc.endDialog(undefined);
            }

            // Send retry prompt
            if (!dc.context.responded && isMessage && state.options.retryPrompt) {
                await dc.context.sendActivity(state.options.retryPrompt);
            }

            return Dialog.EndOfTurn;
        }
    }

    /**
     * Attempts to retrieve the stored token for the current user.
     *
     * @param context Context reference the user that's being looked up.
     * @param code (Optional) login code received from the user.
     * @returns The token response.
     */
    async getUserToken(context: TurnContext, code?: string): Promise<TokenResponse | undefined> {
        return UserTokenAccess.getUserToken(context, this.settings, code as any);
    }

    /**
     * Signs the user out of the service.
     *
     * @remarks
     * This example shows creating an instance of the prompt and then signing out the user.
     *
     * ```JavaScript
     * const prompt = new OAuthPrompt({
     *    connectionName: 'GitConnection',
     *    title: 'Login To GitHub'
     * });
     * await prompt.signOutUser(context);
     * ```
     * @param context Context referencing the user that's being signed out.
     * @returns A promise representing the asynchronous operation.
     */
    async signOutUser(context: TurnContext): Promise<void> {
        return UserTokenAccess.signOutUser(context, this.settings);
    }

    /**
     * Sends an OAuth card.
     *
     * @param {OAuthPromptSettings} settings OAuth settings.
     * @param {TurnContext} turnContext Turn context.
     * @param {string | Partial<Activity>} prompt Message activity.
     */
    static async sendOAuthCard(
        settings: OAuthPromptSettings,
        turnContext: TurnContext,
        prompt?: string | Partial<Activity>
    ): Promise<void> {
        // Initialize outgoing message
        const msg: Partial<Activity> =
            typeof prompt === 'object'
                ? { ...prompt }
                : MessageFactory.text(prompt!, undefined, InputHints.AcceptingInput);

        if (!Array.isArray(msg.attachments)) {
            msg.attachments = [];
        }

        // Append appropriate card if missing
        if (!this.isOAuthCardSupported(turnContext)) {
            if (!msg.attachments.some((a) => a.contentType === CardFactory.contentTypes.signinCard)) {
                const signInResource = await UserTokenAccess.getSignInResource(turnContext, settings);
                msg.attachments.push(CardFactory.signinCard(settings.title, signInResource.signInLink!, settings.text));
            }
        } else if (!msg.attachments.some((a) => a.contentType === CardFactory.contentTypes.oauthCard)) {
            let cardActionType = ActionTypes.Signin;
            const signInResource = await UserTokenAccess.getSignInResource(turnContext, settings);

            let link = signInResource.signInLink;
            const identity = turnContext.turnState.get<ClaimsIdentity>(turnContext.adapter.BotIdentityKey);

            // use the SignInLink when
            //   in speech channel or
            //   bot is a skill or
            //   an extra OAuthAppCredentials is being passed in
            if (
                OAuthPrompt.isFromStreamingConnection(turnContext.activity) ||
                (identity && SkillValidation.isSkillClaim(identity.claims)) ||
                settings.oAuthAppCredentials
            ) {
                if (turnContext.activity.channelId === Channels.Emulator) {
                    cardActionType = ActionTypes.OpenUrl;
                }
            } else if (
                settings.showSignInLink === false ||
                (!settings.showSignInLink && !this.channelRequiresSignInLink(turnContext.activity.channelId))
            ) {
                link = undefined;
            }

            // Append oauth card
            const card = CardFactory.oauthCard(
                settings.connectionName,
                settings.title,
                settings.text,
                link,
                signInResource.tokenExchangeResource,
                signInResource.tokenPostResource
            );

            // Set the appropriate ActionType for the button.
            (card.content as OAuthCard).buttons[0].type = cardActionType;
            msg.attachments.push(card);
        }

        // Add the login timeout specified in OAuthPromptSettings to TurnState so it can be referenced if polling is needed
        if (!turnContext.turnState.get(OAuthLoginTimeoutKey) && settings.timeout) {
            turnContext.turnState.set(OAuthLoginTimeoutKey, settings.timeout);
        }

        // Set input hint
        if (!msg.inputHint) {
            msg.inputHint = InputHints.AcceptingInput;
        }

        // Send prompt
        await turnContext.sendActivity(msg);
    }

    /**
     * Shared implementation of the RecognizeTokenAsync function. This is intended for internal use, to consolidate
     * the implementation of the OAuthPrompt and OAuthInput. Application logic should use those dialog classes.
     *
     * @param dc The [DialogContext](xref:botbuilder-dialogs.DialogContext) for the current turn of the conversation.
     * @returns A Promise that resolves to the result
     */
    async recognizeToken(dc: DialogContext): Promise<PromptRecognizerResult<TokenResponse>> {
        const context = dc.context;
        let token: TokenResponse | undefined;

        if (OAuthPrompt.isTokenResponseEvent(context)) {
            token = context.activity.value as TokenResponse;

            // Fix-up the DialogContext's state context if this was received from a skill host caller.
            const state: CallerInfo = dc.activeDialog!.state[this.PersistedCaller];
            if (state) {
                // Set the ServiceUrl to the skill host's Url
                context.activity.serviceUrl = state.callerServiceUrl;

                const claimsIdentity = context.turnState.get<ClaimsIdentity>(context.adapter.BotIdentityKey);

                const connectorClient = await UserTokenAccess.createConnectorClient(
                    context,
                    context.activity.serviceUrl,
                    claimsIdentity,
                    state.scope
                );

                context.turnState.set(context.adapter.ConnectorClientKey, connectorClient);
            }
        } else if (OAuthPrompt.isTeamsVerificationInvoke(context)) {
            const magicCode = context.activity.value.state;

            try {
                token = await UserTokenAccess.getUserToken(context, this.settings, magicCode);

                if (token) {
                    await context.sendActivity({ type: 'invokeResponse', value: { status: StatusCodes.OK } });
                } else {
                    await context.sendActivity({ type: 'invokeResponse', value: { status: 404 } });
                }
            } catch (_err) {
                await context.sendActivity({ type: 'invokeResponse', value: { status: 500 } });
            }
        } else if (OAuthPrompt.isTokenExchangeRequestInvoke(context)) {
            // Received activity is not a token exchange request
            if (!(context.activity.value && OAuthPrompt.isTokenExchangeRequest(context.activity.value))) {
                await context.sendActivity(
                    this.getTokenExchangeInvokeResponse(
                        StatusCodes.BAD_REQUEST,
                        'The bot received an InvokeActivity that is missing a TokenExchangeInvokeRequest value. This is required to be sent with the InvokeActivity.'
                    )
                );
            } else if (context.activity.value.connectionName != this.settings.connectionName) {
                // Connection name on activity does not match that of setting
                await context.sendActivity(
                    this.getTokenExchangeInvokeResponse(
                        StatusCodes.BAD_REQUEST,
                        'The bot received an InvokeActivity with a TokenExchangeInvokeRequest containing a ConnectionName that does not match the ConnectionName' +
                            'expected by the bots active OAuthPrompt. Ensure these names match when sending the InvokeActivityInvalid ConnectionName in the TokenExchangeInvokeRequest'
                    )
                );
            } else {
                let tokenExchangeResponse: TokenResponse|undefined;
                try {
                    tokenExchangeResponse = await UserTokenAccess.exchangeToken(context, this.settings, {
                        token: context.activity.value.token,
                    });
                } catch (_err) {
                    // Ignore errors.
                    // If the token exchange failed for any reason, the tokenExchangeResponse stays undefined
                    // and we send back a failure invoke response to the caller.
                }

                if (!tokenExchangeResponse || !tokenExchangeResponse.token) {
                    await context.sendActivity(
                        this.getTokenExchangeInvokeResponse(
                            StatusCodes.PRECONDITION_FAILED,
                            'The bot is unable to exchange token. Proceed with regular login.'
                        )
                    );
                } else {
                    await context.sendActivity(
                        this.getTokenExchangeInvokeResponse(StatusCodes.OK, undefined as any, context.activity.value.id)
                    );
                    token = {
                        channelId: tokenExchangeResponse.channelId,
                        connectionName: tokenExchangeResponse.connectionName,
                        token: tokenExchangeResponse.token,
                        expiration: undefined as any,
                    };
                }
            }
        } else if (context.activity.type === ActivityTypes.Message) {
            const [, magicCode] = /(\d{6})/.exec(context.activity.text) ?? [];
            if (magicCode) {
                token = await UserTokenAccess.getUserToken(context, this.settings, magicCode);
            }
        }

        return token !== undefined ? { succeeded: true, value: token } : { succeeded: false };
    }

    /**
     * @private
     */
    private static createCallerInfo(context: TurnContext) {
        const botIdentity = context.turnState.get<ClaimsIdentity>(context.adapter.BotIdentityKey);
        if (botIdentity && SkillValidation.isSkillClaim(botIdentity.claims)) {
            return {
                callerServiceUrl: context.activity.serviceUrl,
                scope: JwtTokenValidation.getAppIdFromClaims(botIdentity.claims),
            };
        }

        return null;
    }

    /**
     * @private
     */
    private getTokenExchangeInvokeResponse(status: number, failureDetail: string, id?: string): Activity {
        const invokeResponse: Partial<Activity> = {
            type: 'invokeResponse',
            value: { status, body: new TokenExchangeInvokeResponse(id!, this.settings.connectionName, failureDetail) },
        };
        return invokeResponse as Activity;
    }

    /**
     * @private
     */
    private static isFromStreamingConnection(activity: Activity): boolean {
        return activity != undefined && activity.serviceUrl != undefined && !activity.serviceUrl.toLowerCase().startsWith('http');
    }

    /**
     * @private
     */
    private static isTokenResponseEvent(context: TurnContext): boolean {
        const activity: Activity = context.activity;

        return activity.type === ActivityTypes.Event && activity.name === tokenResponseEventName;
    }

    /**
     * @private
     */
    private static isTeamsVerificationInvoke(context: TurnContext): boolean {
        const activity: Activity = context.activity;

        return activity.type === ActivityTypes.Invoke && activity.name === verifyStateOperationName;
    }

    /**
     * @private
     */
    private static isOAuthCardSupported(context: TurnContext): boolean {
        // Azure Bot Service OAuth cards are not supported in the community adapters. Since community adapters
        // have a 'name' in them, we cast the adapter to 'any' to check for the name.
        const adapter: any = context.adapter;
        if (adapter.name) {
            switch (adapter.name) {
                case 'Facebook Adapter':
                case 'Google Hangouts Adapter':
                case 'Slack Adapter':
                case 'Twilio SMS Adapter':
                case 'Web Adapter':
                case 'Webex Adapter':
                case 'Botkit CMS':
                    return false;
                default:
            }
        }
        return this.channelSupportsOAuthCard(context.activity.channelId);
    }

    /**
     * @private
     */
    private static isTokenExchangeRequestInvoke(context: TurnContext): boolean {
        const activity: Activity = context.activity;

        return activity.type === ActivityTypes.Invoke && activity.name === tokenExchangeOperationName;
    }

    /**
     * @private
     */
    private static isTokenExchangeRequest(obj: unknown): obj is TokenExchangeInvokeRequest {
        if (Object.prototype.hasOwnProperty.call(obj, 'token')) {
            return true;
        }
        return false;
    }

    /**
     * @private
     */
    private static channelSupportsOAuthCard(channelId: string): boolean {
        switch (channelId) {
            case Channels.Skype:
            case Channels.Skypeforbusiness:
                return false;
            default:
        }

        return true;
    }

    /**
     * @private
     */
    private static channelRequiresSignInLink(channelId: string): boolean {
        switch (channelId) {
            case Channels.Msteams:
                return true;
            default:
        }

        return false;
    }
}

/**
 * @private
 */
interface OAuthPromptState {
    state: any;
    options: PromptOptions;
    expires: number; // Timestamp of when the prompt will timeout.
}

/**
 * @private
 */
interface CallerInfo {
    callerServiceUrl: string;
    scope: string;
}
