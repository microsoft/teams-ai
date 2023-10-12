import { strict as assert } from "assert";
import { DefaultResponseValidator } from "./DefaultResponseValidator";
import { TestAdapter } from "botbuilder";
import { GPT3Tokenizer } from "../tokenizers";
import { TestTurnState } from "../TestTurnState";


describe("DefaultResponseValidator", () => {
    const adapter = new TestAdapter();
    const tokenizer = new GPT3Tokenizer();

    describe("constructor", () => {
        it("should create a DefaultResponseValidator", () => {
            const validator = new DefaultResponseValidator();
            assert.notEqual(validator, undefined);
        });
    });

    describe("validateResponse", () => {
        it("should return isValid === true", async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const validator = new DefaultResponseValidator();
                const response = await validator.validateResponse(context, state, tokenizer, { status: 'success', message: 'Hello World' }, 3);
                assert.notDeepEqual(response, undefined);
                assert.equal(response.valid, true);
            });
        });
    });
});
