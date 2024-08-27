import { strict as assert } from 'assert';
import path from 'path';

import { DataSource } from '../dataSources';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { ConfiguredPromptManagerOptions, PromptManager } from './PromptManager';
import { Message } from './Message';
import { PromptTemplate } from './PromptTemplate';
import { RenderedPromptSection } from './PromptSection';

describe('PromptManager', () => {
    describe('constructor', () => {
        it('should create a PromptManager', () => {
            const prompts = new TestPromptManager();
            assert.notEqual(prompts, null);
            assert.equal(prompts.hasFunction('test'), false);
        });
    });

    it('should return options', () => {
        const options: ConfiguredPromptManagerOptions = {
            promptsFolder: 'promptFolder',
            role: 'system',
            max_conversation_history_tokens: -1,
            max_history_messages: 10,
            max_input_tokens: -1
        };
        const prompts = new TestPromptManager(options);
        const configuredOptions = prompts.options;
        assert(configuredOptions !== undefined);
        assert(configuredOptions.promptsFolder === 'promptFolder');
        assert(configuredOptions.role === 'system');
        assert(configuredOptions.max_conversation_history_tokens === -1);
        assert(configuredOptions.max_history_messages === 10);
    });

    describe('addDataSource', () => {
        it('should add a data source', () => {
            const prompts = new TestPromptManager();
            const newDataSource: DataSource = {
                name: 'test',
                renderData: async (context, memory, tokenizer, maxTokens): Promise<RenderedPromptSection<string>> => {
                    return Promise.resolve({ text: 'test', output: 'test', length: 1, tokens: 1, tooLong: false });
                }
            };
            prompts.addDataSource(newDataSource);
            assert(newDataSource !== undefined);
        });

        it('should throw an error on adding duplicate data source', () => {
            const prompts = new TestPromptManager();
            const newDataSource: DataSource = {
                name: 'test',
                renderData: async (context, memory, tokenizer, maxTokens): Promise<RenderedPromptSection<string>> => {
                    return Promise.resolve({ text: 'test', output: 'test', length: 1, tokens: 1, tooLong: false });
                }
            };
            prompts.addDataSource(newDataSource);
            assert(newDataSource !== undefined);
            assert.throws(() => prompts.addDataSource(newDataSource));
        });
    });

    describe('getDataSource', () => {
        it('should get a data source', () => {
            const prompts = new TestPromptManager();
            const newDataSource: DataSource = {
                name: 'test',
                renderData: async (context, memory, tokenizer, maxTokens): Promise<RenderedPromptSection<string>> => {
                    return Promise.resolve({ text: 'test', output: 'test', length: 1, tokens: 1, tooLong: false });
                }
            };
            prompts.addDataSource(newDataSource);
            const dataSource = prompts.getDataSource('test');
            assert(dataSource !== undefined);
        });

        it('should throw an error on getting a data source that does not exist', () => {
            const prompts = new TestPromptManager();
            assert.throws(() => prompts.getDataSource('test'));
        });
    });

    describe('hasDataSource', () => {
        it('should return true when a data source exists', () => {
            const prompts = new TestPromptManager();
            const newDataSource: DataSource = {
                name: 'test',
                renderData: async (context, memory, tokenizer, maxTokens): Promise<RenderedPromptSection<string>> => {
                    return Promise.resolve({ text: 'test', output: 'test', length: 1, tokens: 1, tooLong: false });
                }
            };
            prompts.addDataSource(newDataSource);
            assert(prompts.hasDataSource('test'));
        });

        it('should return false when a data source does not exist', () => {
            const prompts = new TestPromptManager();
            assert(!prompts.hasDataSource('test'));
        });

        it(`throws an error if augmentation data_source is not found`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            await assert.rejects(async () => {
                await prompts.getPrompt('chat');
            }, new Error(`DataSource 'azure-ai-search' not found for prompt 'chat'.`));
        });
    });

    describe('addFunction', () => {
        it('should add a function', () => {
            const prompts = new TestPromptManager();
            prompts.addFunction('test', async (context, state, prompts, tokenizer, args) => {});
            assert.equal(prompts.hasFunction('test'), true);
        });

        it('should throw when adding a function that already exists', () => {
            const prompts = new TestPromptManager();
            prompts.addFunction('test', async (context, state, prompts, tokenizer, args) => {});
            assert.throws(() => prompts.addFunction('test', async (context, state, prompts, tokenizer, args) => {}));
        });
    });

    describe('get', () => {
        it('should get a function', () => {
            const prompts = new TestPromptManager();
            prompts.addFunction('test', async (context, state, prompts, tokenizer, args) => {});
            const fn = prompts.getFunction('test');
            assert.notEqual(fn, null);
        });

        it("should throw when getting a function that doesn't exist", () => {
            const prompts = new TestPromptManager();
            assert.throws(() => prompts.getFunction('test'));
        });
    });

    describe('has', () => {
        it("should return false when a function doesn't exist", () => {
            const prompts = new TestPromptManager();
            assert.equal(prompts.hasFunction('test'), false);
        });

        it('should return true when a function exists', () => {
            const prompts = new TestPromptManager();
            prompts.addFunction('test', async (context, state, prompts, tokenizer, args) => {});
            assert.equal(prompts.hasFunction('test'), true);
        });
    });

    describe('Prompts', () => {
        const newPrompt: PromptTemplate = {
            name: 'test',
            prompt: {
                required: true,
                tokens: -1,
                renderAsMessages(context, memory, functions, tokenizer, maxTokens) {
                    return Promise.resolve({
                        messages: [],
                        output: [] as Message<string>[],
                        length: 1,
                        tokens: 1,
                        tooLong: false
                    });
                },
                renderAsText(context, memory, functions, tokenizer, maxTokens) {
                    return Promise.resolve({ text: 'test', output: 'test', length: 1, tokens: 1, tooLong: false });
                }
            },
            config: {
                completion: {
                    frequency_penalty: 0,
                    include_history: true,
                    include_input: true,
                    include_images: false,
                    max_tokens: 100,
                    max_input_tokens: 2048,
                    model: 'test',
                    presence_penalty: 0,
                    temperature: 0,
                    top_p: 1
                },
                schema: 1.1,
                type: 'completion'
            }
        };
        it('addPrompt should add a prompt', async () => {
            const prompts = new TestPromptManager();
            prompts.addPrompt(newPrompt);
            assert.deepEqual(await prompts.getPrompt('test'), newPrompt);
            assert.equal(await prompts.hasPrompt('test'), true);
        });

        it('should throw when adding a prompt that already exists', () => {
            const prompts = new TestPromptManager();
            prompts.addPrompt(newPrompt);
            assert.throws(() => prompts.addPrompt(newPrompt));
        });

        it(`should resolve the prompt template files if the prompt name doesn't exist`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            const prompt = await prompts.getPrompt('unknown');
            assert.notEqual(prompt, null);
        });

        it(`return correct augmentation type if none and add augmentation datasource`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            prompts.addDataSource({
                name: 'azure-ai-search',
                renderData: async (context, memory, tokenizer, maxTokens): Promise<RenderedPromptSection<string>> => {
                    return Promise.resolve({ text: 'test', output: 'test', length: 1, tokens: 1, tooLong: false });
                }
            });
            const prompt = await prompts.getPrompt('chat');
            assert.equal(prompt.config.augmentation!.augmentation_type, 'none');
        });

        it(`return correct augmentation type if tools`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            const prompt = await prompts.getPrompt('tools');
            assert.equal(prompt.config.augmentation!.augmentation_type, 'tools');
        });

        it(`return correct augmentation type if sequence`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            const prompt = await prompts.getPrompt('sequence');
            assert.equal(prompt.config.augmentation!.augmentation_type, 'sequence');
        });

        it(`should throw an error if config.json is missing when using getPrompt`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            assert.rejects(async () => {
                await prompts.getPrompt('missingConfig');
            });
        });

        it(`should throw an error if skprompt.txt is missing when using getPrompt`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            assert.rejects(async () => {
                await prompts.getPrompt('missingPrompt');
            });
        });

        it(`should assign role 'system' if role is missing`, async () => {
            const prompts = new PromptManager({
                role: '',
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            assert.rejects(async () => {
                await prompts.getPrompt('missingPrompt');
            });
        });

        it(`should throw error if augmentation data source doesn't exist`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            await assert.rejects(async () => {
                await prompts.getPrompt('noAugDataSource');
            }, new Error(`DataSource '0' not found for prompt 'noAugDataSource'.`));
        });

        it(`should return false if the prompt does not exist`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            // NOTE: ../internals/testing/assets/test should NOT have folder called notFound
            const result = await prompts.hasPrompt('notFound');
            assert.equal(result, false);
        });

        it(`should migrate schema if schema is 1`, async () => {
            const prompts = new PromptManager({
                promptsFolder: path.join(__dirname, '..', 'internals', 'testing', 'assets', 'test')
            });
            const updatedPrompt = await prompts.getPrompt('updateSchema');
            assert.equal(updatedPrompt.config.schema, 1.1);
            assert.equal(updatedPrompt.config.completion.model, 'defaultBackends');
        });
    });
});
