using Json.More;
using Microsoft.Teams.AI.Utilities;
using System.Text.Json;

namespace Microsoft.Teams.AI.Tests.UtilitiesTests
{
    public class ResponseJsonParsersTests
    {
        [Fact]
        public void ParseJson_Simple()
        {
            var obj = ResponseJsonParsers.ParseJSON("{ \"foo\": \"bar\" }");
            Assert.NotNull(obj);
            Assert.Equal(1, obj.Count());
            Assert.Equal("foo", obj.First().Key);
            Assert.Equal("bar", obj.First().Value.ToString());
        }

        [Fact]
        public void ParseJson_MultiLineObject_ShouldParse()
        {
            var obj = ResponseJsonParsers.ParseJSON("{ \n\"foo\": \"bar\"\n }");
            Assert.NotNull(obj);
            Assert.Equal(1, obj.Count());
            Assert.Equal("foo", obj.First().Key);
            Assert.Equal("bar", obj.First().Value.ToString());
        }

        [Fact]
        public void ParseJson_EscapedQuotes_ShouldParse()
        {
            var obj = ResponseJsonParsers.ParseJSON("{ \"foo\": \"bar\\\"baz\" }");
            Assert.NotNull(obj);
            Assert.Equal(1, obj.Count());
            Assert.Equal("foo", obj.First().Key);
            Assert.Equal("bar\"baz", obj.First().Value.ToString());
        }

        [Fact]
        public void ParseJson_EscapedBackSlashes_ShouldParse()
        {
            var obj = ResponseJsonParsers.ParseJSON("{ \"foo\": \"bar\\\\\"baz\" }");
            Assert.NotNull(obj);
            Assert.Equal(1, obj.Count());
            Assert.Equal("foo", obj.First().Key);
            Assert.Equal("bar\"baz", obj.First().Value.ToString());
        }

        [Fact]
        public void ParseJson_EscapedSlashes_ShouldParse()
        {
            var obj = ResponseJsonParsers.ParseJSON("{ \"foo\": \"bar\\/baz\" }");
            Assert.NotNull(obj);
            Assert.Equal(1, obj.Count());
            Assert.Equal("foo", obj.First().Key);
            Assert.Equal("bar/baz", obj.First().Value.ToString());
        }

        [Fact]
        public void ParseJson_EmbeddedObject_ShouldParse()
        {
            var obj = ResponseJsonParsers.ParseJSON("Hello { \"foo\": \"bar\" } World!");
            Assert.NotNull(obj);
            Assert.Equal(1, obj.Count());
            Assert.Equal("foo", obj.First().Key);
            Assert.Equal("bar", obj.First().Value.ToString());
        }

        [Fact]
        public void ParseJson_EmptyEmbeddedObject_ShouldNotParse()
        {
            var obj = ResponseJsonParsers.ParseJSON("Hello {} World!");
            Assert.Null(obj);
        }

        [Fact]
        public void ParseJson_SingleOpenBrace_ShouldNotParse()
        {
            var obj = ResponseJsonParsers.ParseJSON("Hello { World!");
            Assert.Null(obj);
        }

        [Fact]
        public void ParseJson_ComplexObject_ShouldParse()
        {
            var obj = ResponseJsonParsers.ParseJSON("Plan: {\"foo\":\"bar\",\"baz\":[1,2,3],\"qux\":{\"quux\":\"dog\"}}");

            Assert.NotNull(obj);
            Assert.Equal(3, obj.Count());

            Assert.Equal("foo", obj.First().Key);
            Assert.Equal("bar", obj.First().Value.ToString());

            Assert.Equal("baz", obj.ElementAt(1).Key);
            Assert.Equal(new List<int> { 1, 2, 3 }, obj.ElementAt(1).Value.Deserialize<List<int>>());

            Assert.Equal("qux", obj.ElementAt(2).Key);
            Assert.Equal("quux", obj.ElementAt(2).Value.Deserialize<Dictionary<string, JsonElement>>()?.First().Key);
            Assert.Equal("dog", obj.ElementAt(2).Value.Deserialize<Dictionary<string, JsonElement>>()?.First().Value.ToString());
        }
    }
}
