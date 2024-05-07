import { strict as assert } from 'assert';
import { TestAdapter } from 'botbuilder';
import axios from 'axios';
import sinon from 'sinon';

import { AI } from '../AI';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { Plan, PredictedDoCommand, PredictedSayCommand } from '../planners';
import { OpenAIModerator, OpenAIModeratorOptions } from './OpenAIModerator';

describe('OpenAIModerator', () => {
    const mockAxios = axios;
    let sinonSandbox: sinon.SinonSandbox;
    let createStub: sinon.SinonStub;
    let inputModerator: OpenAIModerator;
    let outputModerator: OpenAIModerator;
    const adapter = new TestAdapter();
    const inputOptions: OpenAIModeratorOptions = {
        apiKey: 'test',
        moderate: 'input',
        endpoint: 'https://test.com',
        organization: 'stub',
        apiVersion: '2023-03-15-preview',
        model: 'gpt-3.5-turbo'
    };
    const outputOptions: OpenAIModeratorOptions = {
        apiKey: 'test',
        moderate: 'output',
        endpoint: 'https://test.com',
        organization: 'stub',
        apiVersion: '2023-03-15-preview',
        model: 'gpt-3.5-turbo'
    };
    const flaggedHateResponse = {
        status: '200',
        statusText: 'OK',
        data: {
            results: [
                {
                    flagged: true,
                    categories: {
                        hate: true,
                        'hate/threatening': true,
                        'self-harm': false,
                        sexual: false,
                        'sexual/minors': false,
                        violence: false,
                        'violence/graphic': false
                    },
                    category_scores: {
                        hate: 0.16666666666666666,
                        'hate/threatening': 0.16666666666666666,
                        'self-harm': 0,
                        sexual: 0,
                        'sexual/minors': 0,
                        violence: 0,
                        'violence/graphic': 0
                    }
                }
            ]
        }
    };
    const flaggedSelfHarmSexualViolenceResponse = {
        status: '200',
        statusText: 'OK',
        data: {
            results: [
                {
                    flagged: true,
                    categories: {
                        hate: false,
                        'hate/threatening': false,
                        'self-harm': true,
                        sexual: true,
                        'sexual/minors': true,
                        violence: true,
                        'violence/graphic': true
                    },
                    category_scores: {
                        hate: 0,
                        'hate/threatening': 0,
                        'self-harm': 0.16666666666666666,
                        sexual: 0.16666666666666666,
                        'sexual/minors': 0.16666666666666666,
                        violence: 0.16666666666666666,
                        'violence/graphic': 0.16666666666666666
                    }
                }
            ]
        }
    };
    const unflaggedResponse = {
        status: '200',
        statusText: 'OK',
        data: {
            results: [
                {
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
                }
            ]
        }
    };

    beforeEach(() => {
        sinonSandbox = sinon.createSandbox();
        createStub = sinonSandbox.stub(axios, 'create').returns(mockAxios);
        inputModerator = new OpenAIModerator(inputOptions);
        outputModerator = new OpenAIModerator(outputOptions);
    });

    afterEach(() => {
        sinonSandbox.restore();
    });

    describe('constructor', () => {
        it('creates a moderator', () => {
            const options: OpenAIModeratorOptions = {
                apiKey: 'test',
                moderate: 'both',
                endpoint: 'https://test.com',
                organization: 'stub',
                apiVersion: '2023-03-15-preview',
                model: 'gpt-3.5-turbo'
            };
            const moderator = new OpenAIModerator(options);

            assert.equal(createStub.called, true);
            assert.notEqual(moderator, undefined);
            assert.equal(moderator.options.apiKey, options.apiKey);
            assert.equal(moderator.options.apiVersion, options.apiVersion);
            assert.equal(moderator.options.endpoint, options.endpoint);
            assert.equal(moderator.options.model, options.model);
            assert.equal(moderator.options.moderate, options.moderate);
            assert.equal(moderator.options.organization, options.organization);
        });
    });

    describe('reviewInput', () => {
        it('reviews input where result exists and is flagged', async () => {
            sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(flaggedHateResponse));
            await adapter.sendTextToBot('test', async (context) => {
                context.activity.text = 'Hate, hate, hate';
                const state = await TestTurnState.create(context, {
                    temp: { a: 'foo' }
                });
                const plan = await inputModerator.reviewInput(context, state);

                assert.notEqual(plan, undefined);
                assert.equal(plan?.type, 'plan');
                assert.equal(plan?.commands.length, 1);
                assert.deepEqual(plan?.commands[0], {
                    type: 'DO',
                    action: AI.FlaggedInputActionName,
                    parameters: flaggedHateResponse.data.results[0]
                } as PredictedDoCommand);
            });
        });

        it('reviews input where result exists and is not flagged', async () => {
            sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(unflaggedResponse));
            await adapter.sendTextToBot('test', async (context) => {
                context.activity.text = 'Neutral';
                const state = await TestTurnState.create(context, {
                    temp: { a: 'foo' }
                });
                const plan = await inputModerator.reviewInput(context, state);

                assert.equal(plan, undefined);
            });
        });

        it('reviews input where result does not exist', async () => {
            sinonSandbox.stub(mockAxios, 'post').returns(
                Promise.resolve({
                    status: '200',
                    statusText: 'OK'
                })
            );
            await adapter.sendTextToBot('test', async (context) => {
                context.activity.text = '';
                const state = await TestTurnState.create(context, {
                    temp: { a: 'foo' }
                });
                const plan = await inputModerator.reviewInput(context, state);

                assert.notEqual(plan, undefined);
                assert.equal(plan?.type, 'plan');
                assert.equal(plan?.commands.length, 1);
                assert.deepEqual(plan?.commands[0], {
                    type: 'DO',
                    action: AI.HttpErrorActionName,
                    parameters: {}
                } as PredictedDoCommand);
            });
        });
    });

    describe('reviewOutput', () => {
        it('reviews output of single SAY command, where result exists and is flagged', async () => {
            sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(flaggedSelfHarmSexualViolenceResponse));
            await adapter.sendTextToBot('test', async (context) => {
                context.activity.text = 'Self harm, violence, sexual';
                const state = await TestTurnState.create(context, {
                    temp: { a: 'foo' }
                });
                const inputPlan: Plan = {
                    type: 'plan',
                    commands: [
                        {
                            type: 'SAY',
                            response: {
                                role: 'assistant',
                                content: 'Self harm, violence, sexual'
                            }
                        } as PredictedSayCommand
                    ]
                };
                const plan = await outputModerator.reviewOutput(context, state, inputPlan);

                assert.notEqual(plan, undefined);
                assert.equal(plan?.type, 'plan');
                assert.equal(plan.commands.length, 1);
                assert.deepEqual(plan.commands[0], {
                    type: 'DO',
                    action: AI.FlaggedOutputActionName,
                    parameters: flaggedSelfHarmSexualViolenceResponse.data.results[0]
                } as PredictedDoCommand);
            });
        });

        it('reviews output of single SAY command, where result exists and is not flagged', async () => {
            sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(unflaggedResponse));
            await adapter.sendTextToBot('test', async (context) => {
                context.activity.text = 'Neutral';
                const state = await TestTurnState.create(context, {
                    temp: { a: 'foo' }
                });
                const inputPlan: Plan = {
                    type: 'plan',
                    commands: [
                        {
                            type: 'SAY',
                            response: {
                                role: 'assistant',
                                content: 'Neutral'
                            }
                        } as PredictedSayCommand
                    ]
                };
                const plan = await outputModerator.reviewOutput(context, state, inputPlan);

                assert.deepEqual(plan, inputPlan);
            });
        });

        it('reviews output of single SAY command where result does not exist', async () => {
            sinonSandbox.stub(mockAxios, 'post').returns(
                Promise.resolve({
                    status: '200',
                    statusText: 'OK'
                })
            );
            await adapter.sendTextToBot('test', async (context) => {
                context.activity.text = '';
                const state = await TestTurnState.create(context, {
                    temp: { a: 'foo' }
                });
                const inputPlan: Plan = {
                    type: 'plan',
                    commands: [
                        {
                            type: 'SAY',
                            response: {
                                role: 'assistant',
                                content: ''
                            }
                        } as PredictedSayCommand
                    ]
                };
                const plan = await outputModerator.reviewOutput(context, state, inputPlan);

                assert.notEqual(plan, undefined);
                assert.equal(plan?.type, 'plan');
                assert.equal(plan.commands.length, 1);
                assert.deepEqual(plan.commands[0], {
                    type: 'DO',
                    action: AI.HttpErrorActionName,
                    parameters: {}
                } as PredictedDoCommand);
            });
        });

        it('reviews output of plan with single DO command', async () => {
            sinonSandbox.stub(mockAxios, 'post').returns(Promise.resolve(flaggedSelfHarmSexualViolenceResponse));
            await adapter.sendTextToBot('test', async (context) => {
                context.activity.text = 'Self harm, violence, sexual';
                const state = await TestTurnState.create(context, {
                    temp: { a: 'foo' }
                });
                const inputPlan: Plan = {
                    type: 'plan',
                    commands: [
                        {
                            type: 'DO'
                        }
                    ]
                };
                const plan = await outputModerator.reviewOutput(context, state, inputPlan);

                assert.notEqual(plan, undefined);
                assert.deepEqual(plan, inputPlan);
            });
        });
    });
});
