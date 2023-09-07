import { strict as assert } from "assert";
import { TextSection } from "./TextSection";
import { VolatileMemory } from "./VolatileMemory";
import { PromptManager } from "./PromptManager";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("TextSection", () => {
    const memory = new VolatileMemory();
    const functions = new PromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a TextSection", () => {
            const section = new TextSection("Hello World", "user");
            assert.equal(section.text, "Hello World");
            assert.equal(section.role, "user");
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, "\n");
        });

        it("should create a TextSection with other params", () => {
            const section = new TextSection("Hello World", "system", 2.0, false);
            assert.equal(section.text, "Hello World");
            assert.equal(section.role, "system");
            assert.equal(section.tokens, 2.0);
            assert.equal(section.required, false);
            assert.equal(section.separator, "\n");
        });
    });

    describe("renderAsMessages", () => {
        it("should render a TextSection to an array of messages", async () => {
            const section = new TextSection("Hello World", "user");
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "user", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a output as being too long", async () => {
            const section = new TextSection("Hello World", "user");
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 1);
            assert.deepEqual(rendered.output, [{ role: "user", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });

        it("should support multiple message render calls", async () => {
            const section = new TextSection("Hello World", "user");
            const rendered1 = await section.renderAsMessages(memory, functions, tokenizer, 1);
            assert.deepEqual(rendered1.output, [{ role: "user", content: "Hello World" }]);

            const rendered2 = await section.renderAsMessages(memory, functions, tokenizer, 1);
            assert.deepEqual(rendered2.output, [{ role: "user", content: "Hello World" }]);
        });
    });

    describe("renderAsText", () => {
        it("should render a TextSection to a string", async () => {
            const section = new TextSection("Hello World", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a text output as being too long", async () => {
            const section = new TextSection("Hello World", "user");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 1);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });

        it("should support multiple text render calls", async () => {
            const section = new TextSection("Hello World", "user");
            const rendered1 = await section.renderAsText(memory, functions, tokenizer, 1);
            assert.equal(rendered1.output, "Hello World");

            const rendered2 = await section.renderAsText(memory, functions, tokenizer, 1);
            assert.equal(rendered2.output, "Hello World");
        });
    });
});
