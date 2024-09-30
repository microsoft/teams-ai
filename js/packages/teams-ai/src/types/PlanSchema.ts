/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Schema } from 'jsonschema';
/**
 * JSON schema for a `Plan`.
 */
export const PlanSchema: Schema = {
    type: 'object',
    properties: {
        type: {
            type: 'string',
            enum: ['plan']
        },
        commands: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['DO', 'SAY']
                    },
                    action: {
                        type: 'string'
                    },
                    parameters: {
                        type: 'object'
                    },
                    response: {
                        type: 'string'
                    }
                },
                required: ['type']
            },
            minItems: 1
        }
    },
    required: ['type', 'commands']
};
