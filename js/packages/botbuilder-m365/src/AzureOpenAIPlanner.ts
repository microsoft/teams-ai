/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DefaultTurnState } from "./DefaultTurnStateManager";
import { OpenAIClient, AzureOpenAIClient } from "./OpenAIClients";
import { OpenAIPlanner, OpenAIPlannerOptions } from "./OpenAIPlanner";
import { TurnState } from "./TurnState";

export interface AzureOpenAIPlannerOptions extends OpenAIPlannerOptions {
    endpoint: string;
    apiVersion?: string;
}

export class AzureOpenAIPlanner<
    TState extends TurnState = DefaultTurnState
> extends OpenAIPlanner<TState, AzureOpenAIPlannerOptions> {

    protected createClient(options: AzureOpenAIPlannerOptions): OpenAIClient {
        return new AzureOpenAIClient({ 
            apiKey: options.apiKey,
            apiVersion: options.apiVersion,
            endpoint: options.endpoint
        });
    }
}