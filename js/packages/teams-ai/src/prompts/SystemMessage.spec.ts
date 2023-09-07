import { strict as assert } from "assert";
import { SystemMessage } from "./SystemMessage";
import { VolatileMemory } from "./VolatileMemory";
import { PromptManager } from "./PromptManager";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("SystemMessage", () => {
    const memory = new VolatileMemory();
    const functions = new PromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a SystemMessage", () => {
            const section = new SystemMessage("Hello World");
            assert.equal(section.template, "Hello World");
            assert.equal(section.role, "system");
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, "\n");
        });
    });

    describe("renderAsMessages", () => {
        it("should render a SystemMessage to an array of messages", async () => {
            const section = new SystemMessage("Hello World");
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "system", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });
    });

    describe("renderAsText", () => {
        it("should render a TemplateSection to a string", async () => {
            const section = new SystemMessage("Hello World");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });
    });
});
