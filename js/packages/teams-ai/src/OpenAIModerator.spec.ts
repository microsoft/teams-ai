import axios, { AxiosError } from 'axios';
import { strict as assert } from 'assert';
import { restore, stub } from 'sinon';
import { TurnContext, CloudAdapter } from 'botbuilder';

import { OpenAIModerator } from './OpenAIModerator';
import { TurnStateEntry } from './TurnState';
import { AI, AIHistoryOptions } from './AI';
import { OpenAIPlanner } from './OpenAIPlanner';
import { DefaultPromptManager } from './DefaultPromptManager';
import { CreateModerationResponseResultsInner, ModerationResponse, OpenAIClientResponse } from './OpenAIClients';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { PromptTemplate } from './Prompts';
import { Plan, PredictedSayCommand } from './Planner';

describe('OpenAIModerator', () => {
    afterEach(() => {
        restore();
    });

    describe('reviewPrompt', () => {
        const adapter = new CloudAdapter();
        const planner = new OpenAIPlanner({
            apiKey: 'test',
            defaultModel: 'gpt-3.5-turbo'
        });

        const promptManager = new DefaultPromptManager({
            promptsFolder: ''
        });

        const historyOptions: AIHistoryOptions = {
            assistantHistoryType: 'text',
            assistantPrefix: 'Assistant:',
            lineSeparator: '\n',
            maxTokens: 1000,
            maxTurns: 3,
            trackHistory: true,
            userPrefix: 'User:'
        };

        const state: DefaultTurnState = {
            conversation: new TurnStateEntry({}),
            user: new TurnStateEntry({}),
            temp: new TurnStateEntry({
                history: '',
                input: '',
                output: '',
                authTokens: {}
            })
        };

        const promptTemplate: PromptTemplate = {
            text: '',
            config: {
                type: 'completion',
                schema: 1,
                description: '',
                completion: {
                    frequency_penalty: 0,
                    max_tokens: 0,
                    presence_penalty: 0,
                    temperature: 0,
                    top_p: 0
                }
            }
        };

        it('should return plan with action `HttpErrorActionName` when `code` >= 400', async () => {
            stub(axios, 'create').returns({
                post() {
                    throw new AxiosError('bad request', '400');
                }
            } as any);

            const moderator = new OpenAIModerator({
                apiKey: 'test',
                moderate: 'both'
            });

            const plan = await moderator.reviewPrompt(
                new TurnContext(adapter, { text: 'test' }),
                state,
                promptTemplate,
                {
                    history: historyOptions,
                    moderator: moderator,
                    planner: planner,
                    promptManager: promptManager
                }
            );

            assert.deepEqual(plan, {
                type: 'plan',
                commands: [
                    {
                        type: 'DO',
                        action: AI.HttpErrorActionName,
                        entities: {
                            code: '400',
                            message: 'bad request'
                        }
                    }
                ]
            });
        });

        it('should throw when non-Axios error', async () => {
            stub(axios, 'create').returns({
                post() {
                    throw new Error('something went wrong');
                }
            } as any);

            const moderator = new OpenAIModerator({
                apiKey: 'test',
                moderate: 'both'
            });

            const res = moderator.reviewPrompt(new TurnContext(adapter, { text: 'test' }), state, promptTemplate, {
                history: historyOptions,
                moderator: moderator,
                planner: planner,
                promptManager: promptManager
            });

            await assert.rejects(res);
        });

        it('should return plan with action `FlaggedInputActionName` when input is flagged', async () => {
            const result: CreateModerationResponseResultsInner = {
                flagged: true,
                categories: {
                    hate: true,
                    'hate/threatening': true,
                    'self-harm': true,
                    sexual: true,
                    'sexual/minors': true,
                    violence: true,
                    'violence/graphic': true
                },
                category_scores: {
                    hate: 0,
                    'hate/threatening': 0,
                    'self-harm': 0,
                    sexual: 0,
                    'sexual/minors': 0,
                    violence: 0,
                    'violence/graphic': 0
                }
            };

            stub(axios, 'create').returns({
                post() {
                    return {
                        headers: {},
                        status: 200,
                        statusText: 'ok',
                        data: {
                            id: '1',
                            model: 'gpt-3.5-turbo',
                            results: [result]
                        }
                    } as OpenAIClientResponse<ModerationResponse>;
                }
            } as any);

            const moderator = new OpenAIModerator({
                apiKey: 'test',
                moderate: 'both'
            });

            const plan = await moderator.reviewPrompt(
                new TurnContext(adapter, { text: 'test' }),
                state,
                promptTemplate,
                {
                    history: historyOptions,
                    moderator: moderator,
                    planner: planner,
                    promptManager: promptManager
                }
            );

            assert.deepEqual(plan, {
                type: 'plan',
                commands: [
                    {
                        type: 'DO',
                        action: AI.FlaggedInputActionName,
                        entities: result
                    }
                ]
            });
        });

        it('should return `undefined` when input is not flagged', async () => {
            const result: CreateModerationResponseResultsInner = {
                flagged: false,
                categories: {
                    hate: false,
                    'hate/threatening': false,
                    'self-harm': false,
                    sexual: false,
                    'sexual/minors': false,
                    violence: false,
                    'violence/graphic': false
                },
                category_scores: {
                    hate: 0,
                    'hate/threatening': 0,
                    'self-harm': 0,
                    sexual: 0,
                    'sexual/minors': 0,
                    violence: 0,
                    'violence/graphic': 0
                }
            };

            stub(axios, 'create').returns({
                post() {
                    return {
                        headers: {},
                        status: 200,
                        statusText: 'ok',
                        data: {
                            id: '1',
                            model: 'gpt-3.5-turbo',
                            results: [result]
                        }
                    } as OpenAIClientResponse<ModerationResponse>;
                }
            } as any);

            const moderator = new OpenAIModerator({
                apiKey: 'test',
                moderate: 'both'
            });

            const plan = await moderator.reviewPrompt(
                new TurnContext(adapter, { text: 'test' }),
                state,
                promptTemplate,
                {
                    history: historyOptions,
                    moderator: moderator,
                    planner: planner,
                    promptManager: promptManager
                }
            );

            assert.equal(plan, undefined);
        });
    });

    describe('reviewPlan', () => {
        const adapter = new CloudAdapter();
        const state: DefaultTurnState = {
            conversation: new TurnStateEntry({}),
            user: new TurnStateEntry({}),
            temp: new TurnStateEntry({
                history: '',
                input: '',
                output: '',
                authTokens: {}
            })
        };

        it('should return plan with action `HttpErrorActionName` when `code` >= 400', async () => {
            stub(axios, 'create').returns({
                post() {
                    throw new AxiosError('bad request', '400');
                }
            } as any);

            const moderator = new OpenAIModerator({
                apiKey: 'test',
                moderate: 'both'
            });

            const plan = await moderator.reviewPlan(new TurnContext(adapter, { text: 'test' }), state, {
                type: 'plan',
                commands: [
                    {
                        type: 'SAY',
                        response: 'test'
                    } as PredictedSayCommand
                ]
            });

            assert.deepEqual(plan, {
                type: 'plan',
                commands: [
                    {
                        type: 'DO',
                        action: AI.HttpErrorActionName,
                        entities: {
                            code: '400',
                            message: 'bad request'
                        }
                    }
                ]
            });
        });

        it('should throw when non-Axios error', async () => {
            stub(axios, 'create').returns({
                post() {
                    throw new Error('something went wrong');
                }
            } as any);

            const moderator = new OpenAIModerator({
                apiKey: 'test',
                moderate: 'both'
            });

            const res = moderator.reviewPlan(new TurnContext(adapter, { text: 'test' }), state, {
                type: 'plan',
                commands: [
                    {
                        type: 'SAY',
                        response: 'test'
                    } as PredictedSayCommand
                ]
            });

            await assert.rejects(res);
        });

        it('should return plan with action `FlaggedOutputActionName` when input is flagged', async () => {
            const result: CreateModerationResponseResultsInner = {
                flagged: true,
                categories: {
                    hate: true,
                    'hate/threatening': true,
                    'self-harm': true,
                    sexual: true,
                    'sexual/minors': true,
                    violence: true,
                    'violence/graphic': true
                },
                category_scores: {
                    hate: 0,
                    'hate/threatening': 0,
                    'self-harm': 0,
                    sexual: 0,
                    'sexual/minors': 0,
                    violence: 0,
                    'violence/graphic': 0
                }
            };

            stub(axios, 'create').returns({
                post() {
                    return {
                        headers: {},
                        status: 200,
                        statusText: 'ok',
                        data: {
                            id: '1',
                            model: 'gpt-3.5-turbo',
                            results: [result]
                        }
                    } as OpenAIClientResponse<ModerationResponse>;
                }
            } as any);

            const moderator = new OpenAIModerator({
                apiKey: 'test',
                moderate: 'both'
            });

            const plan = await moderator.reviewPlan(new TurnContext(adapter, { text: 'test' }), state, {
                type: 'plan',
                commands: [
                    {
                        type: 'SAY',
                        response: 'test'
                    } as PredictedSayCommand
                ]
            });

            assert.deepEqual(plan, {
                type: 'plan',
                commands: [
                    {
                        type: 'DO',
                        action: AI.FlaggedOutputActionName,
                        entities: result
                    }
                ]
            });
        });

        it('should return `undefined` when input is not flagged', async () => {
            const result: CreateModerationResponseResultsInner = {
                flagged: false,
                categories: {
                    hate: false,
                    'hate/threatening': false,
                    'self-harm': false,
                    sexual: false,
                    'sexual/minors': false,
                    violence: false,
                    'violence/graphic': false
                },
                category_scores: {
                    hate: 0,
                    'hate/threatening': 0,
                    'self-harm': 0,
                    sexual: 0,
                    'sexual/minors': 0,
                    violence: 0,
                    'violence/graphic': 0
                }
            };

            stub(axios, 'create').returns({
                post() {
                    return {
                        headers: {},
                        status: 200,
                        statusText: 'ok',
                        data: {
                            id: '1',
                            model: 'gpt-3.5-turbo',
                            results: [result]
                        }
                    } as OpenAIClientResponse<ModerationResponse>;
                }
            } as any);

            const moderator = new OpenAIModerator({
                apiKey: 'test',
                moderate: 'both'
            });

            const input: Plan = {
                type: 'plan',
                commands: [
                    {
                        type: 'SAY',
                        response: 'test'
                    } as PredictedSayCommand
                ]
            };

            const plan = await moderator.reviewPlan(new TurnContext(adapter, { text: 'test' }), state, input);

            assert.deepEqual(plan, input);
        });
    });
});
