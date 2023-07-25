/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, SuggestedActions, Attachment, ActivityTypes, ActionTypes, CardAction } from '@microsoft/teams-connector/src/schema';
import { MessageFactory } from './messageFactory';
import { CardFactory } from './cardFactory';

/**
 * The ActivityFactory
 * to generate text and then uses simple markdown semantics like chatdown to create Activity.
 */
export class ActivityFactory {
    private static readonly lgType = 'lgType';
    private static adaptiveCardType: string = CardFactory.contentTypes.adaptiveCard;

    private static readonly genericCardTypeMapping: Map<string, string> = new Map<string, string>([
        ['herocard', CardFactory.contentTypes.heroCard],
        ['thumbnailcard', CardFactory.contentTypes.thumbnailCard],
        ['audiocard', CardFactory.contentTypes.audioCard],
        ['videocard', CardFactory.contentTypes.videoCard],
        ['animationcard', CardFactory.contentTypes.animationCard],
        ['signincard', CardFactory.contentTypes.signinCard],
        ['oauthcard', CardFactory.contentTypes.oauthCard],
        ['receiptcard', CardFactory.contentTypes.receiptCard],
    ]);

    private static readonly activityProperties: string[] = [
        'type',
        'id',
        'timestamp',
        'localTimestamp',
        'localTimezone',
        'callerId',
        'serviceUrl',
        'channelId',
        'from',
        'conversation',
        'recipient',
        'textFormat',
        'attachmentLayout',
        'membersAdded',
        'membersRemoved',
        'reactionsAdded',
        'reactionsRemoved',
        'topicName',
        'historyDisclosed',
        'locale',
        'text',
        'speak',
        'inputHint',
        'summary',
        'suggestedActions',
        'attachments',
        'entities',
        'channelData',
        'action',
        'replyToId',
        'label',
        'valueType',
        'value',
        'name',
        'typrelatesToe',
        'code',
        'expiration',
        'importance',
        'deliveryMode',
        'listenFor',
        'textHighlights',
        'semanticAction',
    ];

    private static readonly cardActionProperties: string[] = [
        'type',
        'title',
        'image',
        'text',
        'displayText',
        'value',
        'channelData',
    ];

    private static readonly attachmentProperties: string[] = [
        'contentType',
        'contentUrl',
        'content',
        'name',
        'thumbnailUrl',
    ];

    private static readonly cardProperties: string[] = [
        'title',
        'subtitle',
        'text',
        'images',
        'image',
        'buttons',
        'tap',
        'media',
        'shareable',
        'autoloop',
        'autostart',
        'aspect',
        'duration',
        'value',
        'connectionName',
        'tokenExchangeResource',
        'facts',
        'items',
        'total',
        'tax',
        'vat',
    ];

    /**
     * Generate the activity.
     *
     * @param lgResult string result from languageGenerator.
     * @returns The generated MessageActivity.
     */
    static fromObject(lgResult: any): Partial<Activity> {
        if (lgResult == null) {
            return { type: ActivityTypes.Message };
        }

        if (typeof lgResult === 'string') {
            return this.buildActivityFromText(lgResult.trim());
        }

        if (typeof lgResult === 'object') {
            return this.buildActivityFromLGStructuredResult(lgResult);
        } else {
            return this.buildActivityFromText(JSON.stringify(lgResult).trim());
        }
    }

    /**
     * Given a lg result, create a text activity. This method will create a MessageActivity from text.
     *
     * @param text lg text output.
     * @returns The created MessageActivity.
     */
    private static buildActivityFromText(text: string): Partial<Activity> {
        const msg: Partial<Activity> = {
            type: ActivityTypes.Message,
        };

        if (text) {
            msg.text = text;
            msg.speak = text;
        }

        return msg;
    }

    /**
     * Given a structured lg result, create an activity. This method will create an MessageActivity from object
     *
     * @param lgValue lg output.
     * @returns The created MessageActivity.
     */
    private static buildActivityFromLGStructuredResult(lgValue: any): Partial<Activity> {
        let activity: Partial<Activity> = {};

        const type: string = this.getStructureType(lgValue);
        if (this.genericCardTypeMapping.has(type) || type === 'attachment') {
            activity = MessageFactory.attachment(this.getAttachment(lgValue));
        } else if (type === 'activity') {
            activity = this.buildActivity(lgValue);
        } else if (lgValue) {
            activity = this.buildActivityFromText(JSON.stringify(lgValue).trim());
        }

        return activity;
    }

    /**
     * Builds an [Activity](xref:botframework-schema.Activity) with a given message.
     *
     * @param messageValue Message value on which to base the activity.
     * @returns [Activity](xref:botframework-schema.Activity) with the given message.
     */
    private static buildActivity(messageValue: any): Partial<Activity> {
        const activity: Partial<Activity> = { type: ActivityTypes.Message };
        for (const key of Object.keys(messageValue)) {
            const property: string = key.trim();
            if (property === this.lgType) {
                continue;
            }

            const value: any = messageValue[key];

            switch (property.toLowerCase()) {
                case 'text':
                    activity.text = typeof value === 'string' ? value : JSON.stringify(value);
                    break;
                case 'speak':
                    activity.speak = typeof value === 'string' ? value : JSON.stringify(value);
                    break;
                case 'attachments':
                    activity.attachments = this.getAttachments(value);
                    break;
                case 'suggestedactions':
                    activity.suggestedActions = this.getSuggestions(value);
                    break;
                default:
                    (activity as Record<string,any>)[this.realProperty(property, this.activityProperties)] = value;
                    break;
            }
        }

        return activity;
    }

    /**
     * @private
     */
    private static getSuggestions(suggestionsValue: any): SuggestedActions {
        const actions: any[] = this.normalizedToList(suggestionsValue);

        const suggestedActions: SuggestedActions = {
            actions: this.getCardActions(actions),
            to: [],
        };

        return suggestedActions;
    }

    /**
     * @private
     */
    private static getButtons(buttonsValue: any): CardAction[] {
        const actions: any[] = this.normalizedToList(buttonsValue);
        return this.getCardActions(actions);
    }

    /**
     * @private
     */
    private static getCardActions(actions: any[]): CardAction[] {
        return actions.map((u: any): CardAction => this.getCardAction(u));
    }

    /**
     * @private
     */
    private static getCardAction(action: any): CardAction {
        let cardAction: CardAction;
        if (typeof action === 'string') {
            cardAction = { type: ActionTypes.ImBack, value: action, title: action, channelData: undefined };
        } else {
            const type: string = this.getStructureType(action);
            cardAction = {
                type: ActionTypes.ImBack,
                title: '',
                value: '',
            };

            if (type === 'cardaction') {
                for (const key of Object.keys(action)) {
                    const property: string = key.trim();
                    if (property === this.lgType) {
                        continue;
                    }
                    (cardAction as Record<string,any>)[this.realProperty(property, this.cardActionProperties)] = action[key];
                }
            }
        }

        return cardAction;
    }

    /**
     * @private
     */
    private static getAttachments(input: any): Attachment[] {
        const attachments: Attachment[] = [];
        const attachmentsJsonList: any[] = this.normalizedToList(input);

        for (const attachmentsJson of attachmentsJsonList) {
            if (typeof attachmentsJson === 'object') {
                attachments.push(this.getAttachment(attachmentsJson));
            }
        }

        return attachments;
    }

    /**
     * @private
     */
    private static getAttachment(input: any): Attachment {
        let attachment: Attachment = {
            contentType: '',
        };
        const type: string = this.getStructureType(input);
        if (this.genericCardTypeMapping.has(type)) {
            attachment = this.getCardAttachment(this.genericCardTypeMapping.get(type)!, input);
        } else if (type === 'adaptivecard') {
            attachment = CardFactory.adaptiveCard(input);
        } else if (type === 'attachment') {
            attachment = this.getNormalAttachment(input);
        } else {
            attachment = { contentType: type, content: input };
        }

        return attachment;
    }

    /**
     * @private
     */
    private static getNormalAttachment(input: any): Attachment {
        const attachment: Attachment = { contentType: '' };

        for (const key of Object.keys(input)) {
            const property: string = key.trim();
            const value: any = input[key];

            switch (property.toLowerCase()) {
                case 'contenttype': {
                    const type: string = value.toString().toLowerCase();
                    if (this.genericCardTypeMapping.has(type)) {
                        attachment.contentType = this.genericCardTypeMapping.get(type)!;
                    } else if (type === 'adaptivecard') {
                        attachment.contentType = this.adaptiveCardType;
                    } else {
                        attachment.contentType = type;
                    }
                    break;
                }
                default: {
                    (attachment as Record<string,any>)[this.realProperty(property, this.attachmentProperties)] = value;
                    break;
                }
            }
        }

        return attachment;
    }

    /**
     * @private
     */
    private static getCardAttachment(type: string, input: any): Attachment {
        const card: any = {};

        for (const key of Object.keys(input)) {
            const property: string = key.trim().toLowerCase();
            const value: any = input[key];

            switch (property) {
                case 'tap': {
                    card[property] = this.getCardAction(value);
                    break;
                }
                case 'image':
                case 'images': {
                    if (type === CardFactory.contentTypes.heroCard || type === CardFactory.contentTypes.thumbnailCard) {
                        if (!('images' in card)) {
                            card['images'] = [];
                        }

                        const imageList = this.normalizedToList(value);
                        imageList.forEach((u): any => card['images'].push(this.normalizedToMediaOrImage(u)));
                    } else {
                        card['image'] = this.normalizedToMediaOrImage(value);
                    }
                    break;
                }
                case 'media': {
                    if (!('media' in card)) {
                        card['media'] = [];
                    }

                    const mediaList = this.normalizedToList(value);
                    mediaList.forEach((u): any => card['media'].push(this.normalizedToMediaOrImage(u)));
                    break;
                }
                case 'buttons': {
                    if (!('buttons' in card)) {
                        card['buttons'] = [];
                    }

                    const buttons: any[] = this.getButtons(value);
                    buttons.forEach((u): any => card[property].push(u));
                    break;
                }
                case 'autostart':
                case 'shareable':
                case 'autoloop': {
                    const boolValue: boolean = this.getValidBooleanValue(value.toString());
                    if (boolValue !== undefined) {
                        card[property] = boolValue;
                    } else {
                        card[property] = value;
                    }
                    break;
                }
                default: {
                    card[this.realProperty(key.trim(), this.cardProperties)] = value;
                    break;
                }
            }
        }

        const attachment: Attachment = {
            contentType: type,
            content: card,
        };

        return attachment;
    }

    /**
     * @private
     */
    private static realProperty(property: string, builtinProperties: string[]): string {
        const properties = builtinProperties.map((u: string): string => u.toLowerCase());
        if (properties.includes(property.toLowerCase())) {
            return builtinProperties[properties.indexOf(property.toLowerCase())];
        } else {
            return property;
        }
    }

    /**
     * @private
     */
    private static normalizedToList(item: any): any[] {
        if (item === undefined) {
            return [];
        } else if (Array.isArray(item)) {
            return item;
        } else {
            return [item];
        }
    }

    /**
     * @private
     */
    private static getStructureType(input: any): string {
        let result = '';

        if (input && typeof input === 'object') {
            if (this.lgType in input) {
                result = input[this.lgType].toString();
            } else if ('type' in input) {
                // Adaptive card type
                result = input['type'].toString();
            }
        }

        return result.trim().toLowerCase();
    }

    /**
     * @private
     */
    private static normalizedToMediaOrImage(item: any): object {
        if (!item) {
            return {};
        } else if (typeof item === 'string') {
            return { url: item };
        } else return item;
    }

    /**
     * @private
     */
    private static getValidBooleanValue(boolValue: any): boolean {
        if (typeof boolValue === 'boolean') {
            return boolValue;
        }

        if (boolValue.toLowerCase() === 'true') {
            return true;
        } else if (boolValue.toLowerCase() === 'false') {
            return false;
        }

        return undefined!;
    }
}
