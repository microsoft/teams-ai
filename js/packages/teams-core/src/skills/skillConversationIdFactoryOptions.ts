/**
 * @module botbuilder-core
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity } from '@microsoft/teams-connector/src/schema';
import { BotFrameworkSkill } from './botFrameworkSkill';

export interface SkillConversationIdFactoryOptions {
    /**
     * The oauth audience scope, used during token retrieval (either https://api.botframework.com or bot app id if this is a skill calling another skill).
     */
    fromBotOAuthScope: string;

    /**
     * The id of the parent bot that is messaging the skill.
     */
    fromBotId: string;

    /**
     * The activity which will be sent to the skill.
     */
    activity: Activity;

    /**
     * The skill to create the conversation Id for.
     */
    botFrameworkSkill: BotFrameworkSkill;
}
