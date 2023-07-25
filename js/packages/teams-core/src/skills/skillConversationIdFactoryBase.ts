/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ConversationReference } from '@microsoft/teams-connector/src/schema';
import { SkillConversationIdFactoryOptions } from './skillConversationIdFactoryOptions';
import { SkillConversationReference } from './skillConversationReference';

/**
 * Defines the methods of a factory that is used to create unique conversation IDs for skill conversations.
 */
export abstract class SkillConversationIdFactoryBase {
    /**
     * Creates a conversation ID for a skill conversation based on the caller's ConversationReference.
     *
     * @param _options The [SkillConversationIdFactoryOptions](xref:botbuilder-core.SkillConversationIdFactoryOptions) to use.
     * @remarks It should be possible to use the returned string on a request URL and it should not contain special characters.
     * Returns A unique conversation ID used to communicate with the skill.
     */
    createSkillConversationIdWithOptions(_options: SkillConversationIdFactoryOptions): Promise<string> {
        throw new Error('Not Implemented');
    }

    /**
     * Creates a conversation ID for a skill conversation based on the caller's ConversationReference.
     *
     * @deprecated Method is deprecated, please use createSkillConversationIdWithOptions() with SkillConversationIdFactoryOptions instead.
     * @param _conversationReference The skill's caller ConversationReference.
     * @remarks It should be possible to use the returned string on a request URL and it should not contain special characters.
     * Returns A unique conversation ID used to communicate with the skill.
     */
    createSkillConversationId(_conversationReference: ConversationReference): Promise<string> {
        throw new Error('Not Implemented');
    }

    /**
     * Gets the ConversationReference created using createSkillConversationId() for a skillConversationId.
     *
     * @deprecated Method is deprecated, please use getSkillConversationReference() instead.
     * @param _skillConversationId A skill conversationId created using createSkillConversationId().
     * @remarks Returns The caller's ConversationReference for a skillConversationId. null if not found.
     */
    getConversationReference(_skillConversationId: string): Promise<ConversationReference> {
        throw new Error('Not Implemented');
    }

    /**
     * Gets the SkillConversationReference created using createSkillConversationId() for a skillConversationId.
     *
     * @param _skillConversationId Gets the SkillConversationReference used during createSkillConversationId for a skillConversationId.
     */
    getSkillConversationReference(_skillConversationId: string): Promise<SkillConversationReference> {
        throw new Error('Not Implemented');
    }

    /**
     * Deletes a ConversationReference.
     *
     * @param skillConversationId A skill conversationId created using createSkillConversationId().
     */
    abstract deleteConversationReference(skillConversationId: string): Promise<void>;
}
