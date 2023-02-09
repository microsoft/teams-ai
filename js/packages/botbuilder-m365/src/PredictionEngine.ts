/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { Application } from './Application';
import { TurnState } from './TurnState';

export interface PredictionEngine<TState extends TurnState, TPredictionOptions> {
    predictCommands(app: Application, context: TurnContext, state: TState, data?: Record<string, any>, options?: TPredictionOptions): Promise<PredictedCommand[]>;
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

