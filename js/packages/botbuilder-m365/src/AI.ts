/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CardFactory, Channels, MessageFactory, TurnContext } from 'botbuilder';
import { PredictedDoCommand, PredictedSayCommand, Planner, Plan } from './Planner';
import { ResponseParser } from './ResponseParser';
import { TurnState } from './TurnState';

export interface PredictedDoCommandAndHandler<TState> extends PredictedDoCommand {
    handler: (context: TurnContext, state: TState, data?: Record<string, any>, action?: string) => Promise<boolean>
}

export class AI<
    TState extends TurnState,
    TPlanOptions,
    TPlanner extends Planner<TState, TPlanOptions>
> {
    private readonly _planner: TPlanner;
    private readonly actions: Map<string, ActionEntry<TState>> = new Map();

    public static readonly UnknownActionName = '___UnknownAction___';
    public static readonly OffTopicActionName = '___OffTopic___';
    public static readonly RateLimitedActionName = '___RateLimited___';
    public static readonly PlanReadyActionName = '___PlanReady___';
    public static readonly DoCommandActionName = '___DO___';
    public static readonly SayCommandActionName = '___SAY___';

    public constructor(planner: TPlanner) {
        this._planner = planner;

        // Register default UnknownAction handler
        this.action(
            AI.UnknownActionName,
            (context, state, data, action) => {
                console.error(`An AI action named "${action}" was predicted but no handler was registered.`);
                return Promise.resolve(true);
            },
            true
        );

        // Register default OffTopicAction handler
        this.action(
            AI.OffTopicActionName,
            (context, state, data, action) => {
                console.error(
                    `A Topic Filter was configured but no handler was registered for 'AI.OffTopicActionName'.`
                );
                return Promise.resolve(true);
            },
            true
        );

        // Register default RateLimitedActionName
        this.action(
            AI.RateLimitedActionName,
            (context, state, data, action) => {
                throw new Error(`An AI request failed because it was rate limited`);
            },
            true
        );

        // Register default PlanReadyActionName
        this.action<Plan>(
            AI.PlanReadyActionName,
            async (context, state, plan) => {
                return Array.isArray(plan.commands) && plan.commands.length > 0;
            },
            true
        )

        // Register default DoCommandActionName
        this.action<PredictedDoCommandAndHandler<TState>>(
            AI.DoCommandActionName,
            async (context, state, data, action) => {
                const { entities, handler } = data;
                return await handler(context, state, entities, action);
            },
            true
        );

        // Register default SayCommandActionName
        this.action<PredictedSayCommand>(
            AI.SayCommandActionName,
            async (context, state, data, action) => {
                const response = data.response;
                const card = ResponseParser.parseAdaptiveCard(response);
                if (card) {
                    const attachment = CardFactory.adaptiveCard(card);
                    const activity = MessageFactory.attachment(attachment);
                    await context.sendActivity(activity);
                } else if (context.activity.channelId == Channels.Msteams) {
                    await context.sendActivity(response.split('\n').join('<br>'));
                } else {
                    await context.sendActivity(response);
                }

                return true;
            },
            true
        );

    }

    public get planner(): TPlanner {
        return this._planner;
    }

    /**
     * Registers an handler for a named action.
     *
     * @remarks
     * Actions can be triggered by a planner returning a DO command.
     * @param name Unique name of the action.
     * @param handler Function to call when the action is triggered.
     * @param allowOverrides Optional. If true
     * @returns The application instance for chaining purposes.
     */
    public action<TEntities = Record<string, any>>(
        name: string|string[],
        handler: (context: TurnContext, state: TState, entities: TEntities, action: string) => Promise<boolean>,
        allowOverrides = false
    ): this {
        (Array.isArray(name) ? name : [name]).forEach(n => {
            if (!this.actions.has(n) || allowOverrides) {
                this.actions.set(n, { handler, allowOverrides });
            } else {
                const entry = this.actions.get(n);
                if (entry!.allowOverrides) {
                    entry!.handler = handler;
                } else {
                    throw new Error(
                        `The AI.action() method was called with a previously registered action named "${n}".`
                    );
                }
            }
        });

        return this;
    }

    public async chain(
        context: TurnContext,
        state: TState,
        options?: TPlanOptions,
        message?: string
    ): Promise<boolean> {
        // Call planner
        const plan = await this._planner.generatePlan(context, state, options, message);
        let continueChain = await this.actions
            .get(AI.PlanReadyActionName)!
            .handler(context, state, plan, '');
        if (continueChain) {
            // Run predicted commands
            for (let i = 0; i < plan.commands.length && continueChain; i++) {
                const cmd = plan.commands[i];
                switch (cmd.type) {
                    case 'DO':
                        const { action } = cmd as PredictedDoCommand;
                        if (this.actions.has(action)) {
                            // Call action handler
                            const handler = this.actions.get(action)!.handler;
                            continueChain = await this.actions
                                .get(AI.DoCommandActionName)!
                                .handler(context, state, { handler, ...cmd as PredictedDoCommand }, action);
                        } else {
                            // Redirect to UnknownAction handler
                            continueChain = await this.actions
                                .get(AI.UnknownActionName)!
                                .handler(context, state, plan, action);
                        }
                        break;
                    case 'SAY':
                        continueChain = await this.actions
                            .get(AI.SayCommandActionName)!
                            .handler(context, state, cmd, AI.SayCommandActionName);
                        break;
                    default:
                        throw new Error(`Application.run(): unknown command of '${cmd.type}' predicted.`);
                }
            }
        }

        return continueChain;
    }

    public doAction<TData = Record<string,any>>(context: TurnContext, state: TState, action: string, data?: TData): Promise<boolean> {
        if (!this.actions.has(action)) {
            throw new Error(`Can't find an action named '${action}'.`);
        }

        const handler = this.actions.get(action)!.handler;
        return handler(context, state, data, action);
    }
}

interface ActionEntry<TState> {
    handler: (context: TurnContext, state: TState, data?: Record<string, any>, action?: string) => Promise<boolean>;
    allowOverrides: boolean;
}
