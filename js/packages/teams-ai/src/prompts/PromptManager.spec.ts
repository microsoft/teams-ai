import { strict as assert } from 'assert';
import { TestPromptManager } from './TestPromptManager';

describe('PromptManager', () => {
    describe('constructor', () => {
        it('should create a PromptManager', () => {
            const prompts = new TestPromptManager();
            assert.notEqual(prompts, null);
            assert.equal(prompts.hasFunction('test'), false);
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
});
