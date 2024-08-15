import { strict as assert } from 'assert';
import { TestAdapter, TurnContext } from 'botbuilder-core';
import path from 'path';
import sinon, { createSandbox } from 'sinon';

import { AI } from '../AI';
import { TestModel } from '../models';
import { TestTurnState } from '../internals/testing/TestTurnState';
import { PromptManager, PromptTemplate, UserMessage } from '../prompts';
import { TurnState } from '../TurnState';

import { ActionPlanner } from './ActionPlanner';
import { LLMClient } from './LLMClient';
import { PromptResponse } from '../types';

describe('ActionPlanner', () => {
    const mockLlmClient = LLMClient;
    let completePromptStub: sinon.SinonStub;
    let adapter: TestAdapter;
    let sinonSandbox: sinon.SinonSandbox;
    let actionPlanner: ActionPlanner;
    const mockLlmResponse = {
        status: 'success',
        message: { content: 'response message', role: 'assistant' }
    } as PromptResponse;

    // ActionPlanner requires an AI object as a parameter for beginTask and continueTask but the implementation doesn't use it
    const testAIParam = new AI({} as any);

    beforeEach(() => {
        sinonSandbox = createSandbox();
        completePromptStub = sinonSandbox
            .stub(mockLlmClient.prototype, 'completePrompt')
            .returns(Promise.resolve(mockLlmResponse));
    });

    afterEach(() => {
        sinonSandbox.restore();
    });

    it('constructor', () => {
        const options = {
            model: TestModel.returnContent('hello world'),
            prompts: new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            }),
            defaultPrompt: 'test'
        };
        actionPlanner = new ActionPlanner(options);
        assert(actionPlanner.model instanceof TestModel);
        assert(actionPlanner.prompts instanceof PromptManager);
        assert.equal(actionPlanner.defaultPrompt, 'test');
    });

    it('completePrompt', async () => {
        const basicPromptFactory = async (
            _context: TurnContext,
            _state: TurnState,
            _planner: ActionPlanner
        ): Promise<PromptTemplate> => {
            return Promise.resolve({
                name: 'chat',
                prompt: new UserMessage('Hello'),
                config: {
                    schema: 1.1,
                    type: 'completion',
                    completion: {
                        frequency_penalty: 0,
                        include_history: true,
                        include_input: true,
                        include_images: false,
                        max_input_tokens: 100,
                        max_tokens: 100,
                        presence_penalty: 0,
                        temperature: 0.5,
                        top_p: 1
                    }
                }
            });
        };

        const options = {
            model: TestModel.returnContent('hello world'),
            prompts: new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            }),
            defaultPrompt: basicPromptFactory
        };
        actionPlanner = new ActionPlanner(options);
        assert(actionPlanner.model instanceof TestModel);
        assert(actionPlanner.prompts instanceof PromptManager);

        // Trigger addActionOutputs logic
        const messageHistory = [
            { role: 'user', content: 'good bye' },
            { role: 'assistant', content: 'Farewell!' }
        ];
        adapter = new TestAdapter();
        await adapter.sendTextToBot('test', async (context) => {
            const memory = await TestTurnState.create(context);
            memory.setValue('conversation.tools_history', messageHistory);

            await actionPlanner.completePrompt(context, memory, 'tools');
            assert(completePromptStub.calledOnce);
        });
    });

    it('continueTask should throw when status is "error"', async () => {
        // Clear beforeEach arrangements & create error-path stub
        sinonSandbox.restore();
        const expectedError = new Error('Prompt completion failed');
        completePromptStub = sinonSandbox.stub(mockLlmClient.prototype, 'completePrompt').returns(
            Promise.resolve({
                status: 'error',
                error: expectedError
            })
        );

        const basicPromptFactory = async (
            _context: TurnContext,
            _state: TurnState,
            _planner: ActionPlanner
        ): Promise<PromptTemplate> => {
            return Promise.resolve({
                name: 'tools',
                prompt: new UserMessage('Hello'),
                config: {
                    schema: 1.1,
                    type: 'completion',
                    completion: {
                        frequency_penalty: 0,
                        include_history: true,
                        include_input: true,
                        include_images: false,
                        max_input_tokens: 100,
                        max_tokens: 100,
                        presence_penalty: 0,
                        temperature: 0.5,
                        top_p: 1
                    }
                }
            });
        };

        const options = {
            model: TestModel.returnContent('hello world'),
            prompts: new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            }),
            defaultPrompt: basicPromptFactory
        };
        actionPlanner = new ActionPlanner(options);
        assert(actionPlanner.model instanceof TestModel);
        assert(actionPlanner.prompts instanceof PromptManager);

        adapter = new TestAdapter();
        await adapter.sendTextToBot('test', async (context) => {
            const memory = await TestTurnState.create(context);
            await assert.rejects(
                async () => await actionPlanner.continueTask(context, memory, testAIParam),
                expectedError,
                'Unexpected error thrown'
            );
            assert(completePromptStub.calledOnce);
        });
    });

    it('beginTask', async () => {
        const basicPromptFactory = async (
            _context: TurnContext,
            _state: TurnState,
            _planner: ActionPlanner
        ): Promise<PromptTemplate> => {
            return Promise.resolve({
                name: 'tools',
                prompt: new UserMessage('Hello'),
                config: {
                    schema: 1.1,
                    type: 'completion',
                    completion: {
                        frequency_penalty: 0,
                        include_history: true,
                        include_input: true,
                        include_images: false,
                        max_input_tokens: 100,
                        max_tokens: 100,
                        presence_penalty: 0,
                        temperature: 0.5,
                        top_p: 1
                    }
                }
            });
        };

        const options = {
            model: TestModel.returnContent('hello world'),
            prompts: new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            }),
            defaultPrompt: basicPromptFactory
        };
        actionPlanner = new ActionPlanner(options);
        assert(actionPlanner.model instanceof TestModel);
        assert(actionPlanner.prompts instanceof PromptManager);

        adapter = new TestAdapter();
        await adapter.sendTextToBot('test', async (context) => {
            const memory = await TestTurnState.create(context);
            await actionPlanner.beginTask(context, memory, testAIParam);
            assert(completePromptStub.calledOnce);
        });
    });

    it('addSemanticFunction', async () => {
        const basicPromptFactory = async (
            _context: TurnContext,
            _state: TurnState,
            _planner: ActionPlanner
        ): Promise<PromptTemplate> => {
            return Promise.resolve({
                name: 'tools',
                prompt: new UserMessage('Hello'),
                config: {
                    schema: 1.1,
                    type: 'completion',
                    completion: {
                        frequency_penalty: 0,
                        include_history: true,
                        include_input: true,
                        include_images: false,
                        max_input_tokens: 100,
                        max_tokens: 100,
                        presence_penalty: 0,
                        temperature: 0.5,
                        top_p: 1
                    }
                }
            });
        };

        const options = {
            model: TestModel.returnContent('hello world'),
            prompts: new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            }),
            defaultPrompt: basicPromptFactory
        };
        actionPlanner = new ActionPlanner(options);

        adapter = new TestAdapter();
        await adapter.sendTextToBot('test', async (context) => {
            const memory = await TestTurnState.create(context);
            await actionPlanner.addSemanticFunction('tools');
            const testFunction = actionPlanner.prompts.getFunction('tools');
            const emptyArgs: string[] = [];
            // The first '{}' param is a PromptFunctions instance that is unused in ActionPlanner when registering a semantic function.
            // The second '{}' param is an unused Tokenizer object only in this test, as the value passed in to Utilities.toString is a string.
            const response = await testFunction(context, memory, {} as any, {} as any, emptyArgs);
            assert.deepEqual(response, mockLlmResponse.message?.content);
            assert(completePromptStub.calledOnce);
        });
    });

    it(`addSemanticFunction's function should throw an error if result.status is not 'success'`, async () => {
        // Clear beforeEach arrangements & create error-path stub
        sinonSandbox.restore();
        const expectedError = new Error('Prompt completion failed');
        completePromptStub = sinonSandbox.stub(mockLlmClient.prototype, 'completePrompt').returns(
            Promise.resolve({
                status: 'error',
                error: expectedError
            })
        );

        const basicPromptFactory = async (
            _context: TurnContext,
            _state: TurnState,
            _planner: ActionPlanner
        ): Promise<PromptTemplate> => {
            return Promise.resolve({
                name: 'tools',
                prompt: new UserMessage('Hello'),
                config: {
                    schema: 1.1,
                    type: 'completion',
                    completion: {
                        frequency_penalty: 0,
                        include_history: true,
                        include_input: true,
                        include_images: false,
                        max_input_tokens: 100,
                        max_tokens: 100,
                        presence_penalty: 0,
                        temperature: 0.5,
                        top_p: 1
                    }
                }
            });
        };

        const options = {
            model: TestModel.returnContent('hello world'),
            prompts: new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            }),
            defaultPrompt: basicPromptFactory
        };
        actionPlanner = new ActionPlanner(options);

        adapter = new TestAdapter();
        await adapter.sendTextToBot('test', async (context) => {
            const memory = await TestTurnState.create(context);
            await actionPlanner.addSemanticFunction('tools');
            const testFunction = actionPlanner.prompts.getFunction('tools');
            const emptyArgs: string[] = [];
            await assert.rejects(
                // The first '{}' param is a PromptFunctions instance that is unused in ActionPlanner when registering a semantic function.
                // The second '{}' param is an unused Tokenizer object only in this test, as the value passed in to Utilities.toString is a string.
                async () => await testFunction(context, memory, {} as any, {} as any, emptyArgs),
                expectedError,
                'Unexpected error thrown'
            );

            assert(completePromptStub.calledOnce);
        });
    });
});
