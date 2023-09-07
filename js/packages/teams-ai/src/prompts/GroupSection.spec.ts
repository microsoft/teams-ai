import { strict as assert } from "assert";
import { GroupSection } from "./GroupSection";
import { TextSection } from "./TextSection";
import { VolatileMemory } from "./VolatileMemory";
import { PromptManager } from "./PromptManager";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("GroupSection", () => {
    const memory = new VolatileMemory();
    const functions = new PromptManager();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a GroupSection", () => {
            const section = new GroupSection([
                new TextSection("Hello World", "user")
            ]);
            assert.equal(section.sections.length, 1);
            assert.equal(section.tokens, -1);
            assert.equal(section.required, true);
            assert.equal(section.separator, "\n\n");
        });

        it("should create a GroupSection with a custom params", () => {
            const section = new GroupSection([
                new TextSection("Hello World", "user")
            ], 'user', 100, false, " ");
            assert.equal(section.sections.length, 1);
            assert.equal(section.role, 'user');
            assert.equal(section.tokens, 100);
            assert.equal(section.required, false);
            assert.equal(section.separator, " ");
        });
    });

    describe("renderAsMessages", () => {
        it("should render a TextSection to an array of messages", async () => {
            const section = new GroupSection([
                new TextSection("Hello World", "user")
            ]);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "system", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a output as being too long", async () => {
            const section = new GroupSection([
                new TextSection("Hello World", "user")
            ]);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 1);
            assert.deepEqual(rendered.output, [{ role: "system", content: "Hello World" }]);
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });

        it("should render multiple TextSections as a single messages", async () => {
            const section = new GroupSection([
                new TextSection("Hello", "user"),
                new TextSection("World", "user")
            ]);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "system", content: "Hello\n\nWorld" }]);
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });

        it("should render a hierarchy of sections to a single message", async () => {
            const section = new GroupSection([
                new GroupSection([
                    new TextSection("Hello", "user")
                ]),
                new TextSection("World", "user")
            ]);
            const rendered = await section.renderAsMessages(memory, functions, tokenizer, 100);
            assert.deepEqual(rendered.output, [{ role: "system", content: "Hello\n\nWorld" }]);
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });
    });

    describe("renderAsText", () => {
        it("should render a TextSection to a string", async () => {
            const section = new GroupSection([
                new TextSection("Hello World", "user")
            ]);
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, false);
        });

        it("should identify a text output as being too long", async () => {
            const section = new GroupSection([
                new TextSection("Hello World", "user")
            ]);
            const rendered = await section.renderAsText(memory, functions, tokenizer, 1);
            assert.equal(rendered.output, "Hello World");
            assert.equal(rendered.length, 2);
            assert.equal(rendered.tooLong, true);
        });

        it("should render multiple TextSections to a string", async () => {
            const section = new GroupSection([
                new TextSection("Hello", "user"),
                new TextSection("World", "user")
            ]);
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello\n\nWorld");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });

        it("should render a hierarchy of sections to a string", async () => {
            const section = new GroupSection([
                new GroupSection([
                    new TextSection("Hello", "user")
                ]),
                new TextSection("World", "user")
            ]);
            const rendered = await section.renderAsText(memory, functions, tokenizer, 100);
            assert.equal(rendered.output, "Hello\n\nWorld");
            assert.equal(rendered.length, 4);
            assert.equal(rendered.tooLong, false);
        });
    });
});
