import { strict as assert } from "assert";
import { Message, PromptFunctions, PromptMemory, RenderedPromptSection, Tokenizer } from "./types";
import { PromptSectionBase } from "./PromptSectionBase";
import { VolatileMemory } from "./VolatileMemory";
import { PromptManager } from "./PromptManager";
import { GPT3Tokenizer } from "./GPT3Tokenizer";


export class TestSection extends PromptSectionBase {
    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        return this.returnMessages([{ role: 'test', content: 'Hello Big World' }], 3, tokenizer, maxTokens);
    }
}

export class MultiTestSection extends PromptSectionBase {
    public async renderAsMessages(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        return this.returnMessages([{ role: 'test', content: 'Hello Big' },{ role: 'test', content: 'World' }], 3, tokenizer, maxTokens);
    }
}

describe("PromptSectionBase", () => {
    const memory = new VolatileMemory();
    const functions = new PromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a TestSection", () => {
            const section = new TestSection();
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, "\n");
            assert.equal(section.textPrefix, "");
        });

    });

    describe("renderAsMessages", () => {
        it("should render a TestSection to an array of messages", async () => {
            const section = new TestSection();
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "test", content: "Hello Big World" }]);
            assert.equal(rendered.length, 3);
            assert.equal(rendered.tooLong, false);
        });

        it("should truncate a fixed length TestSection", async () => {
            const section = new TestSection(2);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "test", content: "Hello Big" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a fixed length TestSection as being tooLong", async () => {
            const section = new TestSection(2);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 1);
            assert.deepEqual(rendered.output, [{ role: "test", content: "Hello Big" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });

        it("should drop messages to truncate a fixed length MultiTestSection", async () => {
            const section = new MultiTestSection(2);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "test", content: "Hello Big" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });
    });

    describe("renderAsText", () => {
        it("should render a TestSection to a string", async () => {
            const section = new TestSection();
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello Big World");
            assert.equal(rendered.length, 3);
            assert.equal(rendered.tooLong, false);
        });

        it("should truncate a fixed length TestSection", async () => {
            const section = new TestSection(4, true, "\n", "user: ");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "user: Hello Big");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a fixed length TestSection as being tooLong", async () => {
            const section = new TestSection(4, true, "\n", "user: ");
            const rendered = await section.renderAsText(memory, functions, tokenizer, 1);
            assert.equal(rendered.output, "user: Hello Big");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, true);
        });
    });
});
