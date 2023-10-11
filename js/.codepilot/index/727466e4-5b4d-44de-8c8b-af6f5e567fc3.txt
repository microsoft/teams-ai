import { strict as assert } from "assert";
import { GPT3Tokenizer } from "./GPT3Tokenizer";

describe("GPT3Tokenizer", () => {
    describe("constructor", () => {
        it("should create a GPT3Tokenizer", () => {
            const tokenizer = new GPT3Tokenizer();
            assert.notEqual(tokenizer, null);
        });
    });

    let encoded: number[] = [];
    describe("encode", () => {
        it("should encode a string", async () => {
            const tokenizer = new GPT3Tokenizer();
            encoded = await tokenizer.encode("Hello World");
            assert.equal(encoded.length, 2);
            assert.equal(typeof encoded[0], "number");
        });
    });

    describe("decode", () => {
        it("should decode an array of numbers", async () => {
            const tokenizer = new GPT3Tokenizer();
            const decoded = await tokenizer.decode(encoded);
            assert.equal(decoded, "Hello World");
        });
    });
});
