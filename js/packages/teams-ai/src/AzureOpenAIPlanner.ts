/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DefaultTurnState } from './DefaultTurnStateManager';
import { OpenAIClient, AzureOpenAIClient } from './OpenAIClients';
import { OpenAIPlanner, OpenAIPlannerOptions } from './OpenAIPlanner';
import { TurnState } from './TurnState';

/**
 * Additional options need to use the Azure OpenAI service.
 */
export interface AzureOpenAIPlannerOptions extends OpenAIPlannerOptions {
    /**
     * Endpoint for your Azure OpenAI deployment.
     */
    endpoint: string;

    /**
     * Optional. API version to use.
     */
    apiVersion?: string;
}

/**
 * Planner that uses the Azure OpenAI service.
 * @template TState Optional. Type of state object used by the planner.
 */
export class AzureOpenAIPlanner<TState extends TurnState = DefaultTurnState> extends OpenAIPlanner<
    TState,
    AzureOpenAIPlannerOptions
> {
    /**
     * @private
     */
    protected createClient(options: AzureOpenAIPlannerOptions): OpenAIClient {
        return new AzureOpenAIClient({
            apiKey: options.apiKey,
            apiVersion: options.apiVersion,
            endpoint: options.endpoint
        });
    }
}
