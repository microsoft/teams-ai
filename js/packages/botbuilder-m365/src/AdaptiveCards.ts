/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext, ActivityTypes, InvokeResponse, INVOKE_RESPONSE_KEY, AdaptiveCardInvokeResponse } from 'botbuilder-core';
import { Application, RouteSelector, Query } from './Application';
import { TurnState } from './TurnState';

const ACTION_INVOKE_NAME = `adaptiveCard/action`;
const ACTION_EXECUTE_TYPE = `Action.Execute`;
const DEFAULT_ACTION_SUBMIT_FILTER = 'verb';
const SEARCH_INvOKE_NAME = `application/search`;

export interface AdaptiveCard {
    type: 'AdaptiveCard';
    [key: string]: any;
}

export interface AdaptiveCardsOptions {
    actionSubmitFilter?: string;
}

export interface AdaptiveCardsSearchParams {
    queryText: string;
    dataset: string;
}

export interface AdaptiveCardSearchResult {
    title: string;
    value: string;
} 

export class AdaptiveCards<TState extends TurnState> {
    private readonly _app: Application<TState>;

    public constructor(app: Application<TState>) {
        this._app = app;
    }

    public actionExecute(verb: string|RegExp|RouteSelector|(string|RegExp|RouteSelector)[], handler: (context: TurnContext, state: TState, data: Record<string, any>) => Promise<AdaptiveCard|string>): Application<TState> {
        (Array.isArray(verb) ? verb : [verb]).forEach((v) => {
            const selector = createActionExecuteSelector(v);
            this._app.addRoute(selector, async (context, state) => {
                // Insure that we're in an Action.Execute as expected
                const a = context?.activity;
                if (a?.type !== ActivityTypes.Invoke || a?.name !== ACTION_INVOKE_NAME || a?.value?.action?.type !== ACTION_EXECUTE_TYPE) {
                    throw new Error(`Unexpected AdaptiveCards.actionExecute() triggered for activity type: ${a?.type}`);
                }

                // Call handler and then check to see if an invoke response has already been added 
                const result = await handler(context, state, a.value?.action?.data ?? {});
                if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                    // Format invoke response
                    let response: AdaptiveCardInvokeResponse;
                    if (typeof result == 'string') {
                        // Return message
                        response = {
                            statusCode: 200,
                            type: 'application/vnd.microsoft.activity.message',
                            value: result as any
                        };
                    } else {
                        // Return card
                        response = {
                            statusCode: 200,
                            type: 'application/vnd.microsoft.card.adaptive',
                            value: result
                        }
                    }

                    // Queue up invoke response
                    await context.sendActivity({ value: { body: response, status: 200 } as InvokeResponse, type: ActivityTypes.InvokeResponse })
                }
            }, true);
        });
        return this._app;
    }

    public actionSubmit(verb: string|RegExp|RouteSelector|(string|RegExp|RouteSelector)[], handler: (context: TurnContext, state: TState, data: Record<string, any>) => Promise<void>): Application<TState> {
        const filter = this._app.options.adaptiveCards?.actionSubmitFilter ?? DEFAULT_ACTION_SUBMIT_FILTER;
        (Array.isArray(verb) ? verb : [verb]).forEach((v) => {
            const selector = createActionSubmitSelector(v, filter);
            this._app.addRoute(selector, async (context, state) => {
                // Insure that we're in an Action.Execute as expected
                const a = context?.activity;
                if (a?.type !== ActivityTypes.Message || a?.text || typeof a?.value !== 'object') {
                    throw new Error(`Unexpected AdaptiveCards.actionSubmit() triggered for activity type: ${a?.type}`);
                }

                // Call handler
                await handler(context, state, a.value ?? {});
            });
        });
        return this._app;
    }

    public search(dataset: string|RegExp|RouteSelector|(string|RegExp|RouteSelector)[], handler: (context: TurnContext, state: TState, query: Query<AdaptiveCardsSearchParams>) => Promise<AdaptiveCardSearchResult[]>): Application<TState> {
        (Array.isArray(dataset) ? dataset : [dataset]).forEach((ds) => {
            const selector = createSearchSelector(ds);
            this._app.addRoute(selector, async (context, state) => {
                // Insure that we're in an Action.Execute as expected
                const a = context?.activity;
                if (a?.type !== ActivityTypes.Invoke || a?.name !== SEARCH_INvOKE_NAME) {
                    throw new Error(`Unexpected AdaptiveCards.search() triggered for activity type: ${a?.type}`);
                }

                // Flatten search parameters
                const query: Query<AdaptiveCardsSearchParams> = {
                    count: a?.value?.queryOptions?.top ?? 25,
                    skip: a?.value?.queryOptions?.skip ?? 0,
                    parameters: {
                        queryText: a?.value?.queryText ?? '',
                        dataset: a?.value?.dataset ?? ''
                    }
                };

                // Call handler and then check to see if an invoke response has already been added 
                const results = await handler(context, state, query);
                if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                    // Format invoke response
                    const response = {
                        type: 'application/vnd.microsoft.search.searchResponse',
                        value: {
                            results: results
                        }
                    };

                    // Queue up invoke response
                    await context.sendActivity({ value: { body: response, status: 200 } as InvokeResponse, type: ActivityTypes.InvokeResponse })
                }
            }, true);
        });
        return this._app;
    }
}

function createActionExecuteSelector(verb: string|RegExp|RouteSelector): RouteSelector {
    if (typeof verb == 'function') {
        // Return the passed in selector function
        return verb;
    } else if (verb instanceof RegExp) {
        // Return a function that matches the verb using a RegExp
        return (context: TurnContext) => {
            const a = context?.activity;
            const isInvoke = a?.type == ActivityTypes.Invoke && a?.name === ACTION_INVOKE_NAME && a?.value?.action?.type === ACTION_EXECUTE_TYPE;
            if (isInvoke && typeof a?.value?.action?.verb == 'string') {
                return Promise.resolve(verb.test(a.value.action.verb));
            } else {
                return Promise.resolve(false);
            }
        };
    } else {
        // Return a function that attempts to match verb
        return (context: TurnContext) => {
            const a = context?.activity;
            const isInvoke = a?.type == ActivityTypes.Invoke && a?.name === ACTION_INVOKE_NAME && a?.value?.action?.type === ACTION_EXECUTE_TYPE;
            return Promise.resolve(isInvoke && a?.value?.action?.verb === verb);
        };
    }
}

function createActionSubmitSelector(verb: string|RegExp|RouteSelector, filter: string): RouteSelector {
    if (typeof verb == 'function') {
        // Return the passed in selector function
        return verb;
    } else if (verb instanceof RegExp) {
        // Return a function that matches the verb using a RegExp
        return (context: TurnContext) => {
            const a = context?.activity;
            const isSubmit = a?.type == ActivityTypes.Message && !a?.text && typeof a?.value === 'object';
            if (isSubmit && typeof a?.value[filter] == 'string') {
                return Promise.resolve(verb.test(a.value[filter]));
            } else {
                return Promise.resolve(false);
            }
        };
    } else {
        // Return a function that attempts to match verb
        return (context: TurnContext) => {
            const a = context?.activity;
            const isSubmit = a?.type == ActivityTypes.Message && !a?.text && typeof a?.value === 'object';
            return Promise.resolve(isSubmit && a?.value[filter] === verb);
        };
    }
}

function createSearchSelector(dataset: string|RegExp|RouteSelector): RouteSelector {
    if (typeof dataset == 'function') {
        // Return the passed in selector function
        return dataset;
    } else if (dataset instanceof RegExp) {
        // Return a function that matches the dataset using a RegExp
        return (context: TurnContext) => {
            const a = context?.activity;
            const isSearch = a?.type == ActivityTypes.Invoke && a?.name === SEARCH_INvOKE_NAME;
            if (isSearch && typeof a?.value?.dataset == 'string') {
                return Promise.resolve(dataset.test(a.value.dataset));
            } else {
                return Promise.resolve(false);
            }
        };
    } else {
        // Return a function that attempts to match dataset
        return (context: TurnContext) => {
            const a = context?.activity;
            const isSearch = a?.type == ActivityTypes.Invoke && a?.name === SEARCH_INvOKE_NAME;
            return Promise.resolve(isSearch && a?.value?.dataset === dataset);
        };
    }
}
