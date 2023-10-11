import { strict as assert } from "assert";
import { PromptManager } from "./PromptManager";
import { VolatileMemory } from "./VolatileMemory";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("FunctionRegistry", () => {
    describe("constructor", () => {
        it("should create a FunctionRegistry", () => {
            const registry = new PromptManager();
            assert.notEqual(registry, null);
            assert.equal(registry.hasFunction("test"), false);
        });

        it("should create a FunctionRegistry with initial functions", () => {
            const registry = new PromptManager({
                "test": async (memory, functions, tokenizer, args) => { }
            });
            assert.notEqual(registry, null);
            assert.equal(registry.hasFunction("test"), true);
        });
    });

    describe("addFunction", () => {
        it("should add a function", () => {
            const registry = new PromptManager();
            registry.addFunction("test", async (memory, functions, tokenizer, args) => { });
            assert.equal(registry.hasFunction("test"), true);
        });

        it("should throw when adding a function that already exists", () => {
            const registry = new PromptManager({
                "test": async (memory, functions, tokenizer, args) => { }
            });
            assert.throws(() => registry.addFunction("test", async (memory, functions, tokenizer, args) => { }));
        });
    });

    describe("get", () => {
        it("should get a function", () => {
            const registry = new PromptManager({
                "test": async (memory, functions, tokenizer, args) => { }
            });
            const fn = registry.getFunction("test");
            assert.notEqual(fn, null);
        });

        it("should throw when getting a function that doesn't exist", () => {
            const registry = new PromptManager();
            assert.throws(() => registry.getFunction("test"));
        });
    });

    describe("has", () => {
        it("should return false when a function doesn't exist", () => {
            const registry = new PromptManager();
            assert.equal(registry.hasFunction("test"), false);
        });

        it("should return true when a function exists", () => {
            const registry = new PromptManager({
                "test": async (memory, functions, tokenizer, args) => { }
            });
            assert.equal(registry.hasFunction("test"), true);
        });
    });

    describe("invoke", () => {
        const memory = new VolatileMemory();
        const tokenizer = new GPT3Tokenizer();

        it("should invoke a function", async () => {
            let called = false;
            const registry = new PromptManager({
                "test": async (memory, functions, tokenizer, args) => {
                    assert.equal(args.length, 1);
                    assert.equal(args[0], "Hello World");
                    called = true;
                }
            });
            await registry.invokeFunction("test", memory, registry, tokenizer, ["Hello World"]);
            assert.equal(called, true);
        });

        it("should throw when invoking a function that doesn't exist", () => {
            const registry = new PromptManager();
            assert.throws(() => registry.invokeFunction("test", memory, registry, tokenizer, ["Hello World"]));
        });
    });
});
