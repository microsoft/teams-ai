/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// TODO:
/* eslint-disable security/detect-object-injection */
import {
    TurnContext,
    ActivityTypes,
    InvokeResponse,
    INVOKE_RESPONSE_KEY,
    AdaptiveCardInvokeResponse
} from 'botbuilder';
import { Application, RouteSelector, Query } from './Application';
import { TurnState } from './TurnState';

/**
 * @private
 */
const ACTION_INVOKE_NAME = `adaptiveCard/action`;

/**
 * @private
 */
const ACTION_EXECUTE_TYPE = `Action.Execute`;

/**
 * @private
 */
const DEFAULT_ACTION_SUBMIT_FILTER = 'verb';

/**
 * @private
 */
const SEARCH_INvOKE_NAME = `application/search`;

/**
 * Strongly typed Adaptive Card.
 * @summary
 * see https://adaptivecards.io/explorer/ for schema details.
 */
export interface AdaptiveCard {
    /**
     * Required type field.
     */
    type: 'AdaptiveCard';

    /**
     * Additional card fields.
     */
    [key: string]: any;
}

/**
 * Options for AdaptiveCards class.
 */
export interface AdaptiveCardsOptions {
    /**
     * Data field used to identify the Action.Submit handler to trigger.
     * @summary
     * When an Action.Submit is triggered, the field name specified here will be used to determine
     * the handler to route the request to.
     *
     * Defaults to a value of 'verb'.
     */
    actionSubmitFilter?: string;
}

/**
 * Parameters passed to AdaptiveCards.search() handler.
 */
export interface AdaptiveCardsSearchParams {
    /**
     * The query text.
     */
    queryText: string;

    /**
     * The dataset to search.
     */
    dataset: string;
}

/**
 * Individual result returned from AdaptiveCards.search() handler.
 */
export interface AdaptiveCardSearchResult {
    /**
     * The title of the result.
     */
    title: string;

    /**
     * The subtitle of the result.
     */
    value: string;
}

/**
 * AdaptiveCards class to enable fluent style registration of handlers related to Adaptive Cards.
 * @template TState Type of the turn state object being persisted.
 */
export class AdaptiveCards<TState extends TurnState> {
    private readonly _app: Application<TState>;

    /**
     * Creates a new instance of the AdaptiveCards class.
     * @param {Application<TState>} app The top level application class to register handlers with.
     * @template TState The type of the state object used by the application.
     */
    public constructor(app: Application<TState>) {
        this._app = app;
    }

    /**
     * Adds a route to the application for handling Adaptive Card Action.Execute events.
     * @template TData Optional. Type of the data associated with the action.
     * @param {string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[]} verb The named action(s) to be handled.
     * @param {(context: TurnContext, state: TState, data: TData) => Promise<AdaptiveCard | string>} handler The code to execute when the action is triggered.
     * @param {TurnContext} handler.context The current turn context.
     * @param {TState} handler.state The current turn state.
     * @param {TData} handler.data The data associated with the action.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public actionExecute<TData = Record<string, any>>(
        verb: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState, data: TData) => Promise<AdaptiveCard | string>
    ): Application<TState> {
        (Array.isArray(verb) ? verb : [verb]).forEach((v) => {
            const selector = createActionExecuteSelector(v);
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an Action.Execute as expected
                    const a = context?.activity;
                    if (
                        a?.type !== ActivityTypes.Invoke ||
                        a?.name !== ACTION_INVOKE_NAME ||
                        a?.value?.action?.type !== ACTION_EXECUTE_TYPE
                    ) {
                        throw new Error(
                            `Unexpected AdaptiveCards.actionExecute() triggered for activity type: ${a?.type}`
                        );
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
                            };
                        }

                        // Queue up invoke response
                        await context.sendActivity({
                            value: { body: response, status: 200 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });
                    }
                },
                true
            );
        });
        return this._app;
    }

    /**
     * Adds a route to the application for handling Adaptive Card Action.Submit events.
     * @summary
     * The route will be added for the specified verb(s) and will be filtered using the
     * `actionSubmitFilter` option. The default filter is to use the `verb` field.
     *
     * For outgoing AdaptiveCards you will need to include the verb's name in the cards Action.Submit.
     * For example:
     *
     * ```JSON
     * {
     *   "type": "Action.Submit",
     *   "title": "OK",
     *   "data": {
     *      "verb": "ok"
     *   }
     * }
     * ```
     * @template TData Optional. Type of the data associated with the action.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} verb The named action(s) to be handled.
     * @param {(context: TurnContext, state: TState, data: TData) => Promise<AdaptiveCard | string>} handler The code to execute when the action is triggered.
     * @returns {Application} The application for chaining purposes.
     */
    public actionSubmit<TData = Record<string, any>>(
        verb: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState, data: TData) => Promise<void>
    ): Application<TState> {
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

    public search(
        dataset: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (
            context: TurnContext,
            state: TState,
            query: Query<AdaptiveCardsSearchParams>
        ) => Promise<AdaptiveCardSearchResult[]>
    ): Application<TState> {
        (Array.isArray(dataset) ? dataset : [dataset]).forEach((ds) => {
            const selector = createSearchSelector(ds);
            this._app.addRoute(
                selector,
                async (context, state) => {
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
                        await context.sendActivity({
                            value: { body: response, status: 200 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });
                    }
                },
                true
            );
        });
        return this._app;
    }
}

/**
 * @param {string | RegExp | RouteSelector} verb The named action to be handled, or a regular expression to match the verb.
 * @private
 * @returns {RouteSelector} A function that matches the verb using a RegExp or attempts to match verb.
 */
function createActionExecuteSelector(verb: string | RegExp | RouteSelector): RouteSelector {
    if (typeof verb == 'function') {
        // Return the passed in selector function
        return verb;
    } else if (verb instanceof RegExp) {
        // Return a function that matches the verb using a RegExp
        return (context: TurnContext) => {
            const a = context?.activity;
            const isInvoke =
                a?.type == ActivityTypes.Invoke &&
                a?.name === ACTION_INVOKE_NAME &&
                a?.value?.action?.type === ACTION_EXECUTE_TYPE;
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
            const isInvoke =
                a?.type == ActivityTypes.Invoke &&
                a?.name === ACTION_INVOKE_NAME &&
                a?.value?.action?.type === ACTION_EXECUTE_TYPE;
            if (isInvoke && a?.value?.action?.verb === verb) {
                return Promise.resolve(true);
            } else {
                return Promise.resolve(false);
            }
        };
    }
}

/**
 * @param {string | RegExp | RouteSelector} verb The named action to be handled, or a regular expression to match the verb.
 * @param {RouteSelector} filter Optional. A filter function to further refine the selection.
 * @private
 * @returns {RouteSelector} A function that matches the verb using a RegExp or attempts to match verb.
 */
function createActionSubmitSelector(verb: string | RegExp | RouteSelector, filter: string): RouteSelector {
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

/**
 * Creates a route selector function for handling Adaptive Card Search.Invoke events.
 * @param {string | RegExp | RouteSelector} dataset The dataset to match, or a regular expression to match the dataset.
 * @private
 * @returns {RouteSelector} A function that matches the dataset using a RegExp or attempts to match dataset.
 */
function createSearchSelector(dataset: string | RegExp | RouteSelector): RouteSelector {
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
