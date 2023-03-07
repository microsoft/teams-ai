/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { TurnState } from './TurnState';

export interface Planner<TState extends TurnState, TPlanOptions> {
    generatePlan(
        context: TurnContext,
        state: TState,
        options?: TPlanOptions,
        message?: string
    ): Promise<Plan>;
}

export interface Plan {
    type: 'plan',
    commands: PredictedCommand[];
}

export interface PredictedCommand {
    type: 'DO' | 'SAY';
}

export interface PredictedDoCommand extends PredictedCommand {
    type: 'DO';
    action: string;
    data: Record<string, any>;
}

export interface PredictedSayCommand extends PredictedCommand {
    type: 'SAY';
    response: string;
}
