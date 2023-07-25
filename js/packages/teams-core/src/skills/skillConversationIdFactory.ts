// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ConversationReference } from '@microsoft/teams-connector/src/schema';
import { SkillConversationIdFactoryBase } from './skillConversationIdFactoryBase';
import { SkillConversationIdFactoryOptions } from './skillConversationIdFactoryOptions';
import { SkillConversationReference } from './skillConversationReference';
import { Storage } from '../storage';
import { TurnContext } from '../turnContext';
import { v4 as uuid } from 'uuid';

/**
 * A SkillConversationIdFactory that stores and retrieves [ConversationReference](xref:botframework-schema:ConversationReference) instances.
 */
export class SkillConversationIdFactory extends SkillConversationIdFactoryBase {
    /**
     * Creates a new instance of the SkillConversationIdFactory class.
     *
     * @param storage The storage for the [ConversationReference](xref:botframework-schema:ConversationReference) instances.
     */
    constructor(private readonly storage: Storage) {
        super();
    }

    /**
     * Creates a conversation ID for a skill conversation based on the caller's [ConversationReference](xref:botframework-schema:ConversationReference).
     *
     * @param options The [SkillConversationIdFactoryOptions](xref:botbuilder-core.SkillConversationIdFactoryOptions) to use.
     * @returns {Promise<string>} A unique conversation ID used to communicate with the skill.
     */
    async createSkillConversationIdWithOptions(options: SkillConversationIdFactoryOptions): Promise<string> {
        const conversationReference = TurnContext.getConversationReference(options.activity);

        const skillConversationId = uuid();

        const skillConversationReference: SkillConversationReference = {
            conversationReference: conversationReference as ConversationReference,
            oAuthScope: options.fromBotOAuthScope,
        };

        await this.storage.write({ [skillConversationId]: skillConversationReference });

        return skillConversationId;
    }

    /**
     * Gets the ConversationReference created using createSkillConversationId() for a skillConversationId.
     *
     * @param skillConversationId A skill conversationId created using createSkillConversationId().
     * @returns {Promise<SkillConversationReference>} The caller's ConversationReference for a skillConversationId. Null if not found.
     */
    async getSkillConversationReference(skillConversationId: string): Promise<SkillConversationReference> {
        const skillConversationInfo = await this.storage.read([skillConversationId]);
        if (!skillConversationInfo) {
            return undefined!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        }

        const skillConversationReference = skillConversationInfo[skillConversationId];
        if (!skillConversationReference) {
            return undefined!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        }

        return skillConversationReference as SkillConversationReference;
    }

    /**
     * Deletes the [SkillConversationReference](xref:botbuilder-core.SkillConversationReference) from the storage.
     *
     * @param skillConversationId The skill conversation id to use as key for the delete.
     * @returns {Promise<void>} A promise representing the asynchronous operation.
     */
    deleteConversationReference(skillConversationId: string): Promise<void> {
        return this.storage.delete([skillConversationId]);
    }
}
