import { Dialog, DialogContext, DialogTurnResult, OAuthPrompt, PromptOptions } from 'botbuilder-dialogs';
import { OAuthSettings } from './Authentication';

import {
    ActionTypes,
    Activity,
    CardFactory,
    Channels,
    InputHints,
    MessageFactory,
    OAuthCard,
    OAuthLoginTimeoutKey,
    TurnContext
} from 'botbuilder';
import * as UserTokenAccess from './UserTokenAccess';

/**
 * Override the `sendOAuthCard` method to add support for disabling SSO and showing the sign-in card instead.
 */
export class OAuthBotPrompt extends OAuthPrompt {
    private oauthSettings: OAuthSettings;

    constructor(dialogId: string, settings: OAuthSettings) {
        super(dialogId, settings);
        this.oauthSettings = settings;
    }

    async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {
        // Ensure prompts have input hint set
        const o: Partial<PromptOptions> = {
            prompt: {
                inputHint: InputHints.AcceptingInput
            },
            retryPrompt: {
                inputHint: InputHints.AcceptingInput
            }
        };

        // Initialize prompt state
        const timeout = typeof this.oauthSettings.timeout === 'number' ? this.oauthSettings.timeout : 900000;
        const state = dc.activeDialog!.state as OAuthPromptState;
        state.state = {};
        state.options = o;
        state.expires = new Date().getTime() + timeout;

        // Prompt user to login
        await OAuthBotPrompt.sendOAuthCard(this.oauthSettings, dc.context, state.options.prompt);
        return Dialog.EndOfTurn;
    }

    /**
     * Sends an OAuth card.
     * @param {OAuthPromptSettings} settings OAuth settings.
     * @param {TurnContext} turnContext Turn context.
     * @param {string | Partial<Activity>} prompt Message activity.
     */
    static override async sendOAuthCard(
        settings: OAuthSettings,
        turnContext: TurnContext,
        prompt?: string | Partial<Activity>
    ): Promise<void> {
        // Initialize outgoing message
        const msg: Partial<Activity> =
            typeof prompt === 'object'
                ? { ...prompt }
                : MessageFactory.text(prompt ?? '', undefined, InputHints.AcceptingInput);

        if (!Array.isArray(msg.attachments)) {
            msg.attachments = [];
        }

        // Append appropriate card if missing
        const msgHasOauthCardAttachment = msg.attachments.some(
            (a) => a.contentType === CardFactory.contentTypes.oauthCard
        );

        if (!msgHasOauthCardAttachment) {
            const cardActionType = ActionTypes.Signin;
            const signInResource = await UserTokenAccess.getSignInResource(turnContext, settings);

            let link = signInResource.signInLink;

            if (
                settings.showSignInLink === false ||
                !this.signInLinkRequiredByChannel(turnContext.activity.channelId)
            ) {
                link = undefined;
            }

            let tokenExchangeResource;
            if (settings.enableSso === true) {
                // Send the tokene exchange resource only if enableSso is true.
                tokenExchangeResource = signInResource.tokenExchangeResource;
            }

            // Append oauth card
            const card = CardFactory.oauthCard(
                settings.connectionName,
                settings.title,
                settings.text,
                link,
                tokenExchangeResource,
                signInResource.tokenPostResource
            );

            // Set the appropriate ActionType for the button.
            (card.content as OAuthCard).buttons[0].type = cardActionType;
            msg.attachments.push(card);
        }

        // Add the login timeout specified in OAuthPromptSettings to Turn Context's turn state so it can be referenced if polling is needed
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

    private static signInLinkRequiredByChannel(channelId: string): boolean {
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
