/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BotFrameworkClient,
    BotFrameworkSkill,
    ConversationState,
    SkillConversationIdFactoryBase,
} from '@microsoft/teams-core';

export interface SkillDialogOptions {
    /**
     * The Microsoft app ID of the bot calling the skill.
     */
    botId: string;

    /**
     * Optional. The OAuth Connection Name for the Parent Bot.
     */
    connectionName?: string;

    /**
     * The BotFrameworkSkill that the dialog will call.
     */
    conversationIdFactory: SkillConversationIdFactoryBase;

    /**
     * The ConversationState to be used by the Dialog.
     */
    conversationState: ConversationState;

    /**
     * The BotFrameworkSkill the dialog will call.
     */
    skill: BotFrameworkSkill;

    /**
     * The BotFrameworkClient used to call the remote skill.
     */
    skillClient: BotFrameworkClient;

    /**
     * The callback Url for the skill host.
     */
    skillHostEndpoint: string;
}
