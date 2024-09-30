/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Schema } from 'jsonschema';
/**
 * JSON schema for validating an `InnerMonologue`.
 */
export const InnerMonologueSchema: Schema = {
    type: 'object',
    properties: {
        thoughts: {
            type: 'object',
            properties: {
                thought: { type: 'string' },
                reasoning: { type: 'string' },
                plan: { type: 'string' }
            },
            required: ['thought', 'reasoning', 'plan']
        },
        action: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                parameters: { type: 'object' }
            },
            required: ['name']
        }
    },
    required: ['thoughts', 'action']
};
