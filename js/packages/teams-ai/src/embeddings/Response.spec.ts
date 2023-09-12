import { strict as assert } from "assert";
import { Response } from "./Response";


describe("Response", () => {
    describe("parseJSON", () => {
        it("should parse a JSON object", () => {
            const obj = Response.parseJSON('{ "foo": "bar" }');
            assert.deepEqual(obj, { foo: 'bar' });
        });

        it("should parse a JSON object that spans multiple lines", () => {
            const obj = Response.parseJSON('{\n"foo": "bar"\n}');
            assert.deepEqual(obj, { foo: 'bar' });
        });

        it("should parse a JSON object with escaped quotes", () => {
            const obj = Response.parseJSON('{ "foo": "bar\\"baz" }');
            assert.deepEqual(obj, { foo: 'bar"baz' });
        });

        it("should parse a JSON object with escaped backslashes", () => {
            const obj = Response.parseJSON('{ "foo": "bar\\\\baz" }');
            assert.deepEqual(obj, { foo: 'bar\\baz' });
        });

        it("should parse a JSON object with escaped forward slashes", () => {
            const obj = Response.parseJSON('{ "foo": "bar\\/baz" }');
            assert.deepEqual(obj, { foo: 'bar/baz' });
        });

        it("should parse an embedded JSON object", () => {
            const obj = Response.parseJSON('Hello { "foo": "bar" } World');
            assert.deepEqual(obj, { foo: 'bar' });
        });

        it("should return undefined for an empty JSON object", () => {
            const obj = Response.parseJSON('Hello{}World');
            assert.equal(obj, undefined);        });

        it("should return undefined for a single open brace", () => {
            const obj = Response.parseJSON('{');
            assert.equal(obj, undefined);
        });

        it("should parse a complex JSON object", () => {
            const obj = Response.parseJSON('Plan: {"foo":"bar","baz":[1,2,3],"qux":{"quux":"corge"}}');
            assert.deepEqual(obj, { foo: 'bar', baz: [1, 2, 3], qux: { quux: 'corge' } });
        });

        it("should fix missing closing brace", () => {
            const obj = Response.parseJSON('Plan: {"foo":"bar","baz":[1,2,3],"qux":{"quux":"corge"}');
            assert.deepEqual(obj, { foo: 'bar', baz: [1, 2, 3], qux: { quux: 'corge' } });
        });

        it("should fix any missing closing structure", () => {
            const obj = Response.parseJSON('Plan: {"foo":"bar","baz":{"qux":[1,2,3');
            assert.deepEqual(obj, { foo: 'bar', baz: { qux: [1, 2, 3] } });
        });

        it("should fix unquoted <parameters>", () => {
            const obj = Response.parseJSON('Plan: {"foo":<bar>}');
            assert.deepEqual(obj, { foo: '<bar>' });
        });

        it("should return undefined if no start brace", () => {
            const obj = Response.parseJSON('Plan: "foo":"bar"}');
            assert.equal(obj, undefined);
        });

        it("should return undefined for a parse error", () => {
            const obj = Response.parseJSON('Plan: {"foo":"bar","baz":{"qux":[1,2,');
            assert.equal(obj, undefined);
        });

        it("should return undefined for trailing escape character", () => {
            const obj = Response.parseJSON('Plan: {"foo":"bar\\');
            assert.equal(obj, undefined);
        });

        it("should return undefined for an unexpected closing brace", () => {
            const obj = Response.parseJSON('Plan: {"foo": ["bar"}');
            assert.equal(obj, undefined);
        });

        it("should return undefined for an unexpected closing bracket", () => {
            const obj = Response.parseJSON('Plan: {"foo":]"bar"}');
            assert.equal(obj, undefined);
        });
    });

    describe("parseAllObjects", () => {
        it("should parse a single JSON object on one line", () => {
            const objs = Response.parseAllObjects('{ "foo": "bar" }');
            assert.deepEqual(objs, [{ foo: 'bar' }]);
        });

        it("should parse a multiple JSON objects on separate lines", () => {
            const objs = Response.parseAllObjects('{"foo":"bar"}\n{"baz":"qux"}');
            assert.deepEqual(objs, [{ foo: 'bar' }, { baz: 'qux' }]);
        });

        it("should skip lines without JSON objects", () => {
            const objs = Response.parseAllObjects('{"foo":"bar"}\nHello World\nPlan: {"baz":"qux"}');
            assert.deepEqual(objs, [{ foo: 'bar' }, { baz: 'qux' }]);
        });

        it("should return the first JSON object on a line", () => {
            const objs = Response.parseAllObjects('{"foo":"bar"} {"bar":"foo"}\nHello World\nPlan: {"baz":"qux"}');
            assert.deepEqual(objs, [{ foo: 'bar' }, { baz: 'qux' }]);
        });

        it("should parse an object that spans multiple lines", () => {
            const objs = Response.parseAllObjects('{\n"foo": "bar"\n}');
            assert.deepEqual(objs, [{ foo: 'bar' }]);
        });

        it("should return an empty array if no objects found", () => {
            const objs = Response.parseAllObjects('Hello\nWorld');
            assert.deepEqual(objs, []);
        });
    });
});
