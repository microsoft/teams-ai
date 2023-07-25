/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    Activity,
    ActivityTypes,
    Attachment,
    AttachmentLayoutTypes,
    CardAction,
    InputHints,
    SuggestedActions,
} from '@microsoft/teams-connector/src/schema';
import { CardFactory } from './cardFactory';

/**
 * A set of utility functions to assist with the formatting of the various message types a bot can
 * return.
 *
 * @remarks
 * The following example shows sending a message containing a single hero card:
 *
 * ```javascript
 * const { MessageFactory, CardFactory } = require('botbuilder');
 *
 * const card = CardFactory.heroCard(
 *      'White T-Shirt',
 *      ['https://example.com/whiteShirt.jpg'],
 *      ['buy']
 * );
 * const message = MessageFactory.attachment(card);
 * await context.sendActivity(message);
 * ```
 */
export class MessageFactory {
    /**
     * Returns a simple text message.
     *
     * @remarks
     * This example shows sending a simple text message:
     *
     * ```JavaScript
     * const message = MessageFactory.text('Greetings from example message');
     * ```
     * @param text Text to include in the message.
     * @param speak (Optional) SSML to include in the message.
     * @param inputHint (Optional) input hint for the message. Defaults to `acceptingInput`.
     * @returns A message activity containing the text.
     */
    static text(text: string, speak?: string, inputHint?: InputHints | string): Partial<Activity> {
        const msg: Partial<Activity> = {
            type: ActivityTypes.Message,
            text: text,
            inputHint: inputHint || InputHints.AcceptingInput,
        };
        if (speak) {
            msg.speak = speak;
        }

        return msg;
    }

    /**
     * Returns a message that includes a set of suggested actions and optional text.
     *
     * @remarks
     * This example shows creating a message with suggested actions:
     *
     * ```JavaScript
     * const message = MessageFactory.suggestedActions(['red', 'green', 'blue'], `Choose a color`);
     * ```
     * @param actions Array of card actions or strings to include. Strings will be converted to `messageBack` actions.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to include with the message.
     * @param inputHint (Optional) input hint for the message. Defaults to `acceptingInput`.
     * @returns A message activity that contains the suggested actions.
     */
    static suggestedActions(
        actions: (CardAction | string)[],
        text?: string,
        speak?: string,
        inputHint?: InputHints | string
    ): Partial<Activity> {
        const msg: Partial<Activity> = {
            type: ActivityTypes.Message,
            inputHint: inputHint || InputHints.AcceptingInput,
            suggestedActions: <SuggestedActions>{
                actions: CardFactory.actions(actions),
            },
        };
        if (text) {
            msg.text = text;
        }
        if (speak) {
            msg.speak = speak;
        }

        return msg;
    }

    /**
     * Returns a single message activity containing an attachment.
     *
     * @remarks
     * This example shows creating a message with a hero card attachment:
     *
     * ```JavaScript
     * const message = MessageFactory.attachment(
     *     CardFactory.heroCard(
     *         'White T-Shirt',
     *         ['https://example.com/whiteShirt.jpg'],
     *         ['buy']
     *      )
     * );
     * ```
     * @param attachment Adaptive card to include in the message.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to include with the message.
     * @param inputHint (Optional) input hint for the message. Defaults to `acceptingInput`.
     * @returns A message activity containing the attachment.
     */
    static attachment(
        attachment: Attachment,
        text?: string,
        speak?: string,
        inputHint?: InputHints | string
    ): Partial<Activity> {
        return attachmentActivity(AttachmentLayoutTypes.List, [attachment], text, speak, inputHint);
    }

    /**
     * Returns a message that will display a set of attachments in list form.
     *
     * @remarks
     * This example shows creating a message with a list of hero cards:
     *
     * ```JavaScript
     * const message = MessageFactory.list([
     *    CardFactory.heroCard('title1', ['imageUrl1'], ['button1']),
     *    CardFactory.heroCard('title2', ['imageUrl2'], ['button2']),
     *    CardFactory.heroCard('title3', ['imageUrl3'], ['button3'])
     * ]);
     * ```
     * @param attachments Array of attachments to include in the message.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to include with the message.
     * @param inputHint (Optional) input hint for the message.
     * @returns A message activity that will display a set of attachments in list form.
     */
    static list(
        attachments: Attachment[],
        text?: string,
        speak?: string,
        inputHint?: InputHints | string
    ): Partial<Activity> {
        return attachmentActivity(AttachmentLayoutTypes.List, attachments, text, speak, inputHint);
    }

    /**
     * Returns a message that will display a set of attachments using a carousel layout.
     *
     * @remarks
     * This example shows creating a message with a carousel of hero cards:
     *
     * ```JavaScript
     * const message = MessageFactory.carousel([
     *    CardFactory.heroCard('title1', ['imageUrl1'], ['button1']),
     *    CardFactory.heroCard('title2', ['imageUrl2'], ['button2']),
     *    CardFactory.heroCard('title3', ['imageUrl3'], ['button3'])
     * ]);
     * ```
     * @param attachments Array of attachments to include in the message.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to include with the message.
     * @param inputHint (Optional) input hint for the message.
     * @returns A message activity that will display a set of attachments using a carousel layout.
     */
    static carousel(
        attachments: Attachment[],
        text?: string,
        speak?: string,
        inputHint?: InputHints | string
    ): Partial<Activity> {
        return attachmentActivity(AttachmentLayoutTypes.Carousel, attachments, text, speak, inputHint);
    }

    /**
     * Returns a message that will display a single image or video to a user.
     *
     * @remarks
     * This example shows sending an image to the user:
     *
     * ```JavaScript
     * const message = MessageFactory.contentUrl('https://example.com/hawaii.jpg', 'image/jpeg', 'Hawaii Trip', 'A photo from our family vacation.');
     * ```
     * @param url Url of the image/video to send.
     * @param contentType The MIME type of the image/video.
     * @param name (Optional) Name of the image/video file.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to include with the message.
     * @param inputHint (Optional) input hint for the message.
     * @returns A message activity that will display a single image or video to a user.
     */
    static contentUrl(
        url: string,
        contentType: string,
        name?: string,
        text?: string,
        speak?: string,
        inputHint?: InputHints | string
    ): Partial<Activity> {
        const a: Attachment = { contentType: contentType, contentUrl: url };
        if (name) {
            a.name = name;
        }

        return attachmentActivity(AttachmentLayoutTypes.List, [a], text, speak, inputHint);
    }
}

/**
 * @private
 * @param attachmentLayout the direction in which attachments will be laid out
 * @param attachments an array of attachments
 * @param text the text to include
 * @param speak spoken text
 * @param inputHint input hint
 */
function attachmentActivity(
    attachmentLayout: AttachmentLayoutTypes,
    attachments: Attachment[],
    text?: string,
    speak?: string,
    inputHint?: InputHints | string
): Partial<Activity> {
    const msg: Partial<Activity> = {
        type: ActivityTypes.Message,
        attachmentLayout: attachmentLayout,
        attachments: attachments,
        inputHint: inputHint || InputHints.AcceptingInput,
    };
    if (text) {
        msg.text = text;
    }
    if (speak) {
        msg.speak = speak;
    }

    return msg;
}
