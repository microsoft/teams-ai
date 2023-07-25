/**
 * @module botbuilder-core
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ConversationReference } from '@microsoft/teams-connector/src/schema';

export interface SkillConversationReference {
    conversationReference: ConversationReference;
    oAuthScope: string;
}
