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
    CardAction,
    CardFactory,
    InputHints,
    MessageFactory,
    TurnContext,
} from '@microsoft/teams-core';
import * as channel from './channel';
import { Choice } from './findChoices';

/**
 * Additional options used to tweak the formatting of choice lists.
 */
export interface ChoiceFactoryOptions {
    /**
     * (Optional) character used to separate individual choices when there are more than 2 choices.
     * The default value is `", "`.
     */
    inlineSeparator?: string;

    /**
     * (Optional) separator inserted between the choices when their are only 2 choices. The default
     * value is `" or "`.
     */
    inlineOr?: string;

    /**
     * (Optional) separator inserted between the last 2 choices when their are more than 2 choices.
     * The default value is `", or "`.
     */
    inlineOrMore?: string;

    /**
     * (Optional) if `true`, inline and list style choices will be prefixed with the index of the
     * choice as in "1. choice". If `false`, the list style will use a bulleted list instead. The
     * default value is `true`.
     */
    includeNumbers?: boolean;
}

/**
 * A set of utility functions to assist with the formatting a 'message' activity containing a list
 * of choices.
 *
 * @remarks
 * This example shows creating a message containing a list of choices that has been conditionally
 * formatted based on the capabilities of the underlying channel:
 *
 * ```JavaScript
 * const { ChoiceFactory } = require('botbuilder-choices');
 *
 * const message = ChoiceFactory.forChannel(context, ['red', 'green', 'blue'], `Pick a color.`);
 * await context.sendActivity(message);
 * ```
 */
export class ChoiceFactory {
    /**
     * Returns a 'message' activity containing a list of choices that has been automatically
     * formatted based on the capabilities of a given channel.
     *
     * @remarks
     * The algorithm prefers to format the supplied list of choices as suggested actions but can
     * decide to use a text based list if suggested actions aren't natively supported by the
     * channel, there are too many choices for the channel to display, or the title of any choice
     * is too long.
     *
     * If the algorithm decides to use a list it will use an inline list if there are 3 or less
     * choices and all have short titles. Otherwise, a numbered list is used.
     *
     * ```JavaScript
     * const message = ChoiceFactory.forChannel(context, [
     *    { value: 'red', action: { type: 'imBack', title: 'The Red Pill', value: 'red pill' } },
     *    { value: 'blue', action: { type: 'imBack', title: 'The Blue Pill', value: 'blue pill' } },
     * ], `Which do you choose?`);
     * await context.sendActivity(message);
     * ```
     * @param channelOrContext Channel ID or context object for the current turn of conversation.
     * @param choices List of choices to render.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to speak for the message.
     * @param options (Optional) formatting options to use when rendering as a list.
     * @returns The created message activity.
     */
    static forChannel(
        channelOrContext: string | TurnContext,
        choices: (string | Choice)[],
        text?: string,
        speak?: string,
        options?: ChoiceFactoryOptions
    ): Partial<Activity> {
        const channelId: string =
            typeof channelOrContext === 'string' ? channelOrContext : channel.getChannelId(channelOrContext);

        // Normalize choices
        const list: Choice[] = ChoiceFactory.toChoices(choices);

        // Find maximum title length
        let maxTitleLength = 0;
        list.forEach((choice: Choice) => {
            const l: number = choice.action && choice.action.title ? choice.action.title.length : choice.value.length;
            if (l > maxTitleLength) {
                maxTitleLength = l;
            }
        });

        // Determine list style
        const supportsSuggestedActions: boolean = channel.supportsSuggestedActions(channelId, choices.length);
        const maxActionTitleLength: number = channel.maxActionTitleLength(channelId);
        const supportsCardActions = channel.supportsCardActions(channelId, choices.length);
        const longTitles: boolean = maxTitleLength > maxActionTitleLength;
        if (!longTitles && !supportsSuggestedActions && supportsCardActions) {
            // SuggestedActions is the preferred approach, but for channels that don't
            // support them (e.g. Teams, Cortana) we should use a HeroCard with CardActions
            return ChoiceFactory.heroCard(list, text, speak);
        } else if (!longTitles && supportsSuggestedActions) {
            // We always prefer showing choices using suggested actions. If the titles are too long, however,
            // we'll have to show them as a text list.
            return ChoiceFactory.suggestedAction(list, text, speak);
        } else if (!longTitles && choices.length <= 3) {
            // If the titles are short and there are 3 or less choices we'll use an inline list.
            return ChoiceFactory.inline(list, text, speak, options);
        } else {
            // Show a numbered list.
            return ChoiceFactory.list(list, text, speak, options);
        }
    }

    /**
     * Creates a message [Activity](xref:botframework-schema.Activity) that includes a [Choice](xref:botbuilder-dialogs.Choice) list that have been added as `HeroCard`'s.
     *
     * @param choices Optional. The [Choice](xref:botbuilder-dialogs.Choice) list to add.
     * @param text Optional. Text of the message.
     * @param speak Optional. SSML text to be spoken by the bot on a speech-enabled channel.
     * @returns An [Activity](xref:botframework-schema.Activity) with choices as `HeroCard` with buttons.
     */
    static heroCard(choices: (string | Choice)[] = [], text = '', speak = ''): Activity {
        const buttons: CardAction[] = ChoiceFactory.toChoices(choices).map(
            (choice) =>
                ({
                    title: choice.value,
                    type: ActionTypes.ImBack,
                    value: choice.value,
                } as CardAction)
        );
        const attachment = CardFactory.heroCard('', text, undefined, buttons);

        return MessageFactory.attachment(attachment, undefined, speak, InputHints.ExpectingInput) as Activity;
    }

    /**
     * Returns a 'message' activity containing a list of choices that has been formatted as an
     * inline list.
     *
     * @remarks
     * This example generates a message text of "Pick a color: (1. red, 2. green, or 3. blue)":
     *
     * ```JavaScript
     * const message = ChoiceFactory.inline(['red', 'green', 'blue'], `Pick a color:`);
     * await context.sendActivity(message);
     * ```
     * @param choices List of choices to render.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to speak for the message.
     * @param options (Optional) formatting options to tweak rendering of list.
     * @returns The created message activity.
     */
    static inline(
        choices: (string | Choice)[],
        text?: string,
        speak?: string,
        options?: ChoiceFactoryOptions
    ): Partial<Activity> {
        const opt: ChoiceFactoryOptions = {
            inlineSeparator: ', ',
            inlineOr: ' or ',
            inlineOrMore: ', or ',
            includeNumbers: true,
            ...options,
        } as ChoiceFactoryOptions;

        // Format list of choices
        let connector = '';
        let txt: string = text || '';
        txt += ' ';
        ChoiceFactory.toChoices(choices).forEach((choice: any, index: number) => {
            const title: string = choice.action && choice.action.title ? choice.action.title : choice.value;
            // tslint:disable-next-line:prefer-template
            txt += `${connector}${opt.includeNumbers ? '(' + (index + 1).toString() + ') ' : ''}${title}`;
            if (index === choices.length - 2) {
                connector = (index === 0 ? opt.inlineOr : opt.inlineOrMore) || '';
            } else {
                connector = opt.inlineSeparator || '';
            }
        });
        txt += '';

        // Return activity with choices as an inline list.
        return MessageFactory.text(txt, speak, InputHints.ExpectingInput);
    }

    /**
     * Returns a 'message' activity containing a list of choices that has been formatted as an
     * numbered or bulleted list.
     *
     * @remarks
     * This example generates a message with the choices presented as a numbered list:
     *
     * ```JavaScript
     * const message = ChoiceFactory.list(['red', 'green', 'blue'], `Pick a color:`);
     * await context.sendActivity(message);
     * ```
     * @param choices List of choices to render.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to speak for the message.
     * @param options (Optional) formatting options to tweak rendering of list.
     * @returns The created message activity.
     */
    static list(
        choices: (string | Choice)[],
        text?: string,
        speak?: string,
        options?: ChoiceFactoryOptions
    ): Partial<Activity> {
        const opt: ChoiceFactoryOptions = {
            includeNumbers: true,
            ...options,
        } as ChoiceFactoryOptions;

        // Format list of choices
        let connector = '';
        let txt: string = text || '';
        txt += '\n\n   ';
        ChoiceFactory.toChoices(choices).forEach((choice: any, index: number) => {
            const title: string = choice.action && choice.action.title ? choice.action.title : choice.value;
            // tslint:disable-next-line:prefer-template
            txt += `${connector}${opt.includeNumbers ? (index + 1).toString() + '. ' : '- '}${title}`;
            connector = '\n   ';
        });

        // Return activity with choices as a numbered list.
        return MessageFactory.text(txt, speak, InputHints.ExpectingInput);
    }

    /**
     * Returns a 'message' activity containing a list of choices that have been added as suggested
     * actions.
     *
     * @remarks
     * This example generates a message with the choices presented as suggested action buttons:
     *
     * ```JavaScript
     * const message = ChoiceFactory.suggestedAction(['red', 'green', 'blue'], `Pick a color:`);
     * await context.sendActivity(message);
     * ```
     * @param choices List of choices to add.
     * @param text (Optional) text of the message.
     * @param speak (Optional) SSML to speak for the message.
     * @returns An activity with choices as suggested actions.
     */
    static suggestedAction(choices: (string | Choice)[], text?: string, speak?: string): Partial<Activity> {
        // Map choices to actions
        const actions: CardAction[] = ChoiceFactory.toChoices(choices).map<CardAction>((choice: Choice) => {
            if (choice.action) {
                return choice.action;
            } else {
                return { type: ActionTypes.ImBack, value: choice.value, title: choice.value, channelData: undefined };
            }
        });

        // Return activity with choices as suggested actions
        return MessageFactory.suggestedActions(actions, text, speak, InputHints.ExpectingInput);
    }

    /**
     * Takes a mixed list of `string` and `Choice` based choices and returns them as a `Choice[]`.
     *
     * @remarks
     * This example converts a simple array of string based choices to a properly formated `Choice[]`.
     *
     * If the `Choice` has a `Partial<CardAction>` for `Choice.action`, `.toChoices()` will attempt to
     * fill the `Choice.action`.
     *
     * ```JavaScript
     * const choices = ChoiceFactory.toChoices(['red', 'green', 'blue']);
     * ```
     * @param choices List of choices to add.
     * @returns A list of choices.
     */
    static toChoices(choices: (string | Choice)[] | undefined): Choice[] {
        return (choices || [])
            .map((choice) => (typeof choice === 'string' ? { value: choice } : choice))
            .map((choice) => {
                const action = choice.action;
                // If the choice.action is incomplete, populate the missing fields.
                if (action) {
                    action.type = action.type ? action.type : ActionTypes.ImBack;
                    if (!action.value && action.title) {
                        action.value = action.title;
                    } else if (!action.title && action.value) {
                        action.title = action.value;
                    } else if (!action.title && !action.value) {
                        action.title = action.value = choice.value;
                    }
                }
                return choice;
            })
            .filter((choice) => choice);
    }
}
