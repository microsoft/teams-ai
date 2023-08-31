/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnState } from './TurnState';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { PromptTemplate } from './Prompts';
import { ConfiguredAIOptions } from './AI';
import { TurnContext } from 'botbuilder';
import { Plan } from './Planner';
import { ResponseParser } from './ResponseParser';
}

export interface AIApiFactoryOptions {
    /**
     * Optional. A flag indicating if the planner should only say one thing per turn.
     * @summary
     * The planner will attempt to combine multiple SAY commands into a single SAY command when true.
     * Defaults to false.
     */
    oneSayPerTurn?: boolean;
}

export interface AIApiFactory<TState extends TurnState = DefaultTurnState> {
    completePrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<string>;

    generatePlan(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan>;
}

/**
 *
 * @template TState
 * @param {string} response The response from the OpenAI API.
 * @param {ConfiguredAIOptions<TState>} options The options for the AI configuration.
 * @param {boolean} oneSayPerTurn * Optional. A flag indicating if the planner should only say one thing per turn.
 * @returns {Plan} The plan that was generated.
 */
export function createPlan<TState extends TurnState = DefaultTurnState>(
    response: string,
    options: ConfiguredAIOptions<TState>,
    oneSayPerTurn: boolean = false
): Plan {
    // Parse returned prompt response
    if (response) {
        // Patch the occasional "Then DO" which gets predicted
        response = response.trim().replace('Then DO ', 'THEN DO ').replace('Then SAY ', 'THEN SAY ');
        if (response.startsWith('THEN ')) {
            response = response.substring(5);
        }

        // Remove response prefix
        if (options.history.assistantPrefix) {
            // The model sometimes predicts additional text for the human side of things so skip that.
            const pos = response.toLowerCase().indexOf(options.history.assistantPrefix.toLowerCase());
            if (pos >= 0) {
                response = response.substring(pos + options.history.assistantPrefix.length);
            }
        }

        // Parse response into commands
        const plan = ResponseParser.parseResponse(response.trim());

        // Filter to only a single SAY command
        if (oneSayPerTurn) {
            let spoken = false;
            plan.commands = plan.commands.filter((cmd) => {
                if (cmd.type == 'SAY') {
                    if (spoken) {
                        return false;
                    }

                    spoken = true;
                }

                return true;
            });
        }

        return plan;
    }

    // Return an empty plan by default
    return { type: 'plan', commands: [] };
}
