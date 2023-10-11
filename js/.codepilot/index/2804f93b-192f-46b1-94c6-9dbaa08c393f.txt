import { strict as assert } from "assert";
import { UserMessage } from "./UserMessage";
import { VolatileMemory } from "./VolatileMemory";
import { PromptManager } from "./PromptManager";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("UserMessage", () => {
    const memory = new VolatileMemory();
    const functions = new PromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a UserMessage", () => {
            const section = new UserMessage("Hello World");
            assert.equal(section.template, "Hello World");
            assert.equal(section.role, "user");
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, "\n");
            assert.equal(section.textPrefix, "user: ");
        });
    });

    describe("renderAsMessages", () => {
        it("should render a UserMessage to an array of messages", async () => {
            const section = new UserMessage("Hello World");
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "user", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });
    });

    describe("renderAsText", () => {
        it("should render a TemplateSection to a string", async () => {
            const section = new UserMessage("Hello World");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "user: Hello World");
            assert.equal(rendered.length, 5);
            assert.equal(rendered.tooLong, false);
        });
    });
});
