/**
 * @module botbuilder-core
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Registration for a BotFrameworkHttpProtocol based Skill endpoint.
 */
export interface BotFrameworkSkill {
    /**
     * Id of the skill.
     */
    id: string;

    /**
     * AppId of the skill.
     */
    appId: string;

    /**
     * Endpoint for the skill
     */
    skillEndpoint: string;
}
