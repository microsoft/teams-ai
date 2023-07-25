/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity } from '@microsoft/teams-connector/src/schema';
import { Middleware } from './middlewareSet';
import { TurnContext } from './turnContext';

/**
 * Middleware to patch mention Entities from Skype since they don't conform to expected values.
 * Bots that interact with Skype should use this middleware if mentions are used.
 *
 * @remarks
 * A Skype mention "text" field is of the format:
 *   <at id="28:2bc5b54d-5d48-4ff1-bd25-03dcbb5ce918">botname</at>
 * But Activity.Text doesn't contain those tags and RemoveMentionText can't remove
 * the entity from Activity.Text.
 * This will remove the <at> nodes, leaving just the name.
 */
export class SkypeMentionNormalizeMiddleware implements Middleware {
    /**
     * Performs the normalization of Skype mention Entities.
     *
     * @param activity [Activity](xref:botframework-schema.Activity) containing the mentions to normalize.
     */
    static normalizeSkypeMentionText(activity: Activity): void {
        if (activity.channelId === 'skype' && activity.type === 'message') {
            activity.entities!.map((element): void => {
                if (element.type === 'mention') {
                    const text = element['text'];
                    const end = text.indexOf('>');
                    if (end > -1) {
                        const start = text.indexOf('<', end);
                        if (start > -1) element['text'] = text.substring(end + 1, start);
                    }
                }
            });
        }
    }

    /**
     * Middleware implementation which corrects the Entity text of type [Mention](xref:botframework-schema.Mention) to a value that [removeMentionText](xref:botbuilder-core.TurnContext.removeMentionText) can work with.
     *
     * @param turnContext [TurnContext](xref:botbuilder-core.TurnContext) for the current turn of conversation.
     * @param next Delegate to call to continue the bot middleware pipeline.
     */
    async onTurn(turnContext: TurnContext, next: () => Promise<void>): Promise<void> {
        SkypeMentionNormalizeMiddleware.normalizeSkypeMentionText(turnContext.activity);
        await next();
    }
}
