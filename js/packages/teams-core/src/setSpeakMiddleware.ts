// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';
import { ActivityTypes, Channels } from '@microsoft/teams-connector/src/schema';
import { parseDocument } from 'htmlparser2';
import { Middleware } from './middlewareSet';
import { TurnContext } from './turnContext';

const supportedChannels = new Set<string>([Channels.DirectlineSpeech, Channels.Emulator, Channels.Telephony]);

// Iterate through `obj` and all children in an attempt to locale a key `tag`
function hasTag(tag: string, nodes: unknown[]): boolean {
    while (nodes.length) {
        const item = nodes.shift();

        if (
            z
                .object({ tagName: z.string(), children: z.array(z.unknown()) })
                .partial()
                .nonstrict()
                .check(item)
        ) {
            if (item.tagName === tag) {
                return true;
            }

            if (item.children) {
                nodes.push(...item.children);
            }
        }
    }

    return false;
}

/**
 * Support the DirectLine speech and telephony channels to ensure the appropriate SSML tags are set on the
 * Activity Speak property.
 */
export class SetSpeakMiddleware implements Middleware {
    /**
     * Initializes a new instance of the SetSpeakMiddleware class.
     *
     * @param voiceName The SSML voice name attribute value.
     * @param fallbackToTextForSpeak true if an empty Activity.Speak is populated with Activity.Text.
     */
    constructor(private readonly voiceName: string | null, private readonly fallbackToTextForSpeak: boolean) {}

    /**
     * Processes an incoming activity.
     *
     * @param turnContext The context object for this turn.
     * @param next The delegate to call to continue the bot middleware pipeline.
     * @returns A promise representing the async operation.
     */
    onTurn(turnContext: TurnContext, next: () => Promise<void>): Promise<void> {
        turnContext.onSendActivities(async (_ctx, activities, next) => {
            await Promise.all(
                activities.map(async (activity) => {
                    if (activity.type !== ActivityTypes.Message) {
                        return;
                    }

                    if (this.fallbackToTextForSpeak && !activity.speak) {
                        activity.speak = activity.text;
                    }

                    const channelId = turnContext.activity.channelId?.trim().toLowerCase();

                    if (activity.speak && this.voiceName !== null && supportedChannels.has(channelId)) {
                        const nodes = parseDocument(activity.speak).childNodes;

                        if (!hasTag('speak', nodes.slice())) {
                            if (!hasTag('voice', nodes.slice())) {
                                activity.speak = `<voice name='${this.voiceName}'>${activity.speak}</voice>`;
                            }

                            activity.speak = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${
                                activity.locale ?? 'en-US'
                            }'>${activity.speak}</speak>`;
                        }
                    }
                })
            );

            return next();
        });

        return next();
    }
}
