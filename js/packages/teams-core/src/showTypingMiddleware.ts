/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ActivityTypes } from '@microsoft/teams-connector/src/schema';
import { ClaimsIdentity, SkillValidation } from '@microsoft/teams-connector';
import { Middleware } from './middlewareSet';
import { TurnContext } from './turnContext';

/**
 * Middleware that will send a typing indicator automatically for each message.
 *
 * @remarks
 * When added, this middleware will send typing activities back to the user when a Message activity
 * is received to let them know that the bot has received the message and is working on the response.
 * You can specify a delay in milliseconds before the first typing activity is sent and then a frequency,
 * also in milliseconds which determines how often another typing activity is sent. Typing activities
 * will continue to be sent until your bot sends another message back to the user
 */
export class ShowTypingMiddleware implements Middleware {
    /**
     * Create the SendTypingIndicator middleware
     *
     * @param delay {number} Number of milliseconds to wait before sending the first typing indicator.
     * @param period {number} Number of milliseconds to wait before sending each following indicator.
     */
    constructor(private readonly delay: number = 500, private readonly period: number = 2000) {
        if (delay < 0) {
            throw new Error('Delay must be greater than or equal to zero');
        }

        if (period <= 0) {
            throw new Error('Repeat period must be greater than zero');
        }
    }

    /**
     * Processes an incoming activity.
     *
     * @param context {TurnContext} An incoming TurnContext object.
     * @param next {function} The next delegate function.
     */
    async onTurn(context: TurnContext, next: () => Promise<void>) {
        let finished = false;
        let timeout: ReturnType<typeof setTimeout>|undefined;

        const scheduleIndicator = (delay = this.delay) => {
            timeout = setTimeout(async () => {
                if (!finished) {
                    try {
                        await this.sendTypingActivity(context);
                    } catch (err: unknown) {
                        if (context.adapter && context.adapter.onTurnError) {
                            await context.adapter.onTurnError(context, err as Error);
                        } else {
                            throw err;
                        }
                    }

                    scheduleIndicator(this.period);
                }
            }, delay);
        };

        if (!this.isSkillBot(context) && context.activity.type === ActivityTypes.Message) {
            finished = false;
            scheduleIndicator();
        }

        // Execute remaining middleware inside try/finally to ensure we eventually clear timeouts
        try {
            await next();
        } finally {
            finished = true;
            if (timeout) clearTimeout(timeout);
        }
    }

    private isSkillBot(context: TurnContext) {
        const identity = context.turnState.get<ClaimsIdentity>(context.adapter.BotIdentityKey);
        return identity && SkillValidation.isSkillClaim(identity.claims);
    }

    /**
     * @private
     */
    private async sendTypingActivity(context: TurnContext) {
        // Sending the Activity directly via the Adapter avoids other middleware and avoids setting the
        // responded flag. However this also requires that the conversation reference details are explicitly added.
        const conversationReference = TurnContext.getConversationReference(context.activity);

        const typingActivity = TurnContext.applyConversationReference(
            {
                type: ActivityTypes.Typing,
                relatesTo: context.activity.relatesTo,
            },
            conversationReference
        );

        await context.adapter.sendActivities(context, [typingActivity]);
    }
}
