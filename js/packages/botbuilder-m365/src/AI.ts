/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CardFactory, MessageFactory, TurnContext } from 'botbuilder';
import { Application } from './Application';
import { PredictedDoCommand, PredictedSayCommand, PredictionEngine } from './PredictionEngine';
import { ResponseParser } from './ResponseParser';
import { TurnState } from './TurnState';

export class AI<TState extends TurnState, TPredictionOptions, TPredictionEngine extends PredictionEngine<TState, TPredictionOptions>> {
    private readonly _app: Application<TState>;
    private readonly _predictionEngine: TPredictionEngine;
    private readonly _actions: Map<string, ActionEntry<TState>> = new Map();

    public static readonly UnknownActionName = '___UnknownAction___';
    public static readonly OffTopicActionName = '___OffTopic___';
    public static readonly RateLimitedActionName = '___RateLimited___';

    public constructor(app: Application<TState>, predictionEngine: TPredictionEngine) {
        this._app = app;
        this._predictionEngine = predictionEngine;

        // Register default UnknownAction handler
        this.action(AI.UnknownActionName, (context, state, data, action) => {
            console.error(`An AI action named "${action}" was predicted but no handler was registered.`);
            return Promise.resolve(true);
        }, true);

        // Register default OffTopicAction handler
        this.action(AI.OffTopicActionName, (context, state, data, action) => {
            console.error(`A Topic Filter was configured but no handler was registered for 'AI.OffTopicActionName'.`);
            return Promise.resolve(true);
        }, true);

        // Register default RateLimitedActionName
        this.action(AI.RateLimitedActionName, (context, state, data, action) => {
            throw new Error(`An AI request failed because it was rate limited`);
        }, true);
    }

    public get predictionEngine(): TPredictionEngine {
        return this._predictionEngine;
    }

    /**
     * Registers an handler for a named action. 
     * 
     * @remarks
     * Actions can be triggered by a Prediction Engine returning a DO command.
     * @param name Unique name of the action.
     * @param handler Function to call when the action is triggered.
     * @param allowOverrides Optional. If true 
     * @returns The application instance for chaining purposes.
     */
    public action(name: string, handler: (context: TurnContext, state: TState, data?: Record<string, any>, action?: string) => Promise<boolean>, allowOverrides = false): this {
        if (!this._actions.has(name) || allowOverrides) {
            this._actions.set(name, { handler, allowOverrides });
        } else {
            const entry = this._actions.get(name);
            if (entry.allowOverrides) {
                entry.handler = handler;
            } else {
                throw new Error(`The AI.action() method was called with a previously registered action named "${name}".`);
            }
        }
        return this;
    }

    public async chain(context: TurnContext, state: TState, options?: TPredictionOptions, data?: Record<string, any>): Promise<boolean> {
        // Call prediction engine
        let continueChain = true;
        const commands = await this._predictionEngine.predictCommands(context, state, data, options);
        if (commands && commands.length > 0) {
            // Run predicted commands
            for (let i = 0; i < commands.length && continueChain; i++) {
                const cmd = commands[i];
                switch (cmd.type) {
                    case 'DO':
                        const { action, data } = (cmd as PredictedDoCommand);
                        if (this._actions.has(action)) {
                            // Call action handler
                            const handler = this._actions.get(action).handler;
                            continueChain = await handler(context, state, data, action);
                        } else {
                            // Redirect to UnknownAction handler
                            continueChain = await this._actions.get(AI.UnknownActionName).handler(context, state, data, action);
                        }
                        break;
                    case 'SAY':
                        const response = (cmd as PredictedSayCommand).response;
                        const card = ResponseParser.parseAdaptiveCard(response);
                        if (card) {
                            const attachment = CardFactory.adaptiveCard(card);
                            const activity = MessageFactory.attachment(attachment);
                            await context.sendActivity(activity);

                        } else {
                            await context.sendActivity(response);
                        }
                        break;
                    default:
                        throw new Error(`Application.run(): unknown command of '${cmd.type}' predicted.`);
                }
            }
        }
 
        return continueChain;
    }
}

interface ActionEntry<TState> {
    handler: (context: TurnContext, state: TState, data?: Record<string, any>, action?: string) => Promise<boolean>;
    allowOverrides: boolean;
}