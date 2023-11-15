using Microsoft.Teams.AI.Utilities;

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
        public void ParseJson_SpansMultipleLines_ShouldParse() {
            var obj = ResponseJsonParsers.ParseJSON("{ \"foo\": \"bar\\\\\"baz\" }");
            Assert.NotNull(obj);
            Assert.Equal(1, obj.Count());
            Assert.Equal("foo", obj.First().Key);
            Assert.Equal("bar\"baz", obj.First().Value.ToString());
        }
    }
}
