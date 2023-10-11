import { strict as assert } from "assert";
import { VolatileMemory } from "promptrix";
import { MemoryFork } from "./MemoryFork";


describe("MemoryFork", () => {
    const memory = new VolatileMemory({
        "input": "I'd like to book a flight to London",
        "name": "John Doe"
    });

    describe("constructor", () => {
        it("should create a MemoryFork", () => {
            const fork = new MemoryFork(memory);
            assert.notEqual(fork, undefined);
        });
    });

    const fork = new MemoryFork(memory);
    fork.set("output", "I can help with that");
    describe("has", () => {
        it("should return true for a new memory in the fork", async () => {
            const hasMemory = fork.has('output');
            assert.equal(hasMemory, true);
        });

        it("should return true for a pass through memory", async () => {
            const hasMemory = fork.has('name');
            assert.equal(hasMemory, true);
        });

        it("should return false for a missing missing memory", async () => {
            const hasMemory = fork.has('age');
            assert.equal(hasMemory, false);
        });
    });


    describe("get", () => {
        it("should get the current memory", async () => {
            const input = fork.get('input');
            assert.equal(input, "I'd like to book a flight to London");
        });

        it("should get a pass through memory", async () => {
            const name = fork.get('name');
            assert.equal(name, "John Doe");
        });

        it("should return undefined for a missing pass through memory", async () => {
            const age = fork.get('age');
            assert.equal(age, undefined);
        });
    });

    describe("set", () => {
        it("should change the forked memory without modifying the original memory", async () => {
            fork.set('input', "I'd like first class please");
            const input = fork.get('input');
            assert.equal(input, "I'd like first class please");
            const originalInput = memory.get('input');
            assert.equal(originalInput, "I'd like to book a flight to London");
        });
    });

    describe("delete", () => {
        it("should delete a forked memory without modifying the original memory", async () => {
            fork.delete('input');
            const input = fork.get('input');
            assert.equal(input, "I'd like to book a flight to London");
            const originalInput = memory.get('input');
            assert.equal(originalInput, "I'd like to book a flight to London");
        });

        it("should not delete a pass through memory", async () => {
            fork.delete('name');
            const name = fork.get('name');
            assert.equal(name, "John Doe");
            const originalName = memory.get('name');
            assert.equal(originalName, "John Doe");
        });
    });

    describe("clear", () => {
        it("should clear only the forked memory", async () => {
            fork.clear();
            const output = fork.get('output');
            assert.equal(output, memory.get('output'));
            const input = fork.get('input');
            assert.equal(input, "I'd like to book a flight to London");
        });
    });
});
