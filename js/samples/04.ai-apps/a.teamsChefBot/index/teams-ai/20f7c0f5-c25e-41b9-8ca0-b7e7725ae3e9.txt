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
 * Additional options needed to use the Azure OpenAI service.
 */
export interface AzureOpenAIPlannerOptions extends OpenAIPlannerOptions {
    /**
     * The default model to use. This should be the model deployment name, not the model
     */
    defaultModel: string;
    /**
     * Endpoint for your Azure OpenAI deployment.
     */
    endpoint: string;

    /**
     * Optional. Which Azure API version to use. Defaults to latest.
     */
    apiVersion?: string;
}

/**
 * Planner that uses the Azure OpenAI service.
 * @template TState Optional. Type of the applications turn state.
 */
export class AzureOpenAIPlanner<TState extends TurnState = DefaultTurnState> extends OpenAIPlanner<
    TState,
    AzureOpenAIPlannerOptions
> {
    /**
     * @param {AzureOpenAIPlannerOptions} options Options for the AzureOpenAIPlanner
     * @private
     * @returns {AzureOpenAIClient} A planner that uses Azure OpenAI to generate plans
     */
    protected createClient(options: AzureOpenAIPlannerOptions): OpenAIClient {
        return new AzureOpenAIClient({
            apiKey: options.apiKey,
            apiVersion: options.apiVersion,
            endpoint: options.endpoint
        });
    }
}
