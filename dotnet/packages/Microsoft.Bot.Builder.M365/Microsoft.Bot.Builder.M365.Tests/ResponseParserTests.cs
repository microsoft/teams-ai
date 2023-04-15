using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Bot.Builder.M365;
using Newtonsoft.Json;

namespace Microsoft.Bot.Builder.M365.Tests
{
    public class ResponseParserTests
    {
        [Theory]
        [MemberData(nameof(ParseJsonTestData))]
        public void Test_ParseJson_Simple(string text, List<JObject> expectedJSONs)
        {
            var actualObjects = ResponseParser.ParseJSON(text);

            Assert.Equal(expectedJSONs, actualObjects);
        }

        public static IEnumerable<object[]> ParseJsonTestData()
        {
            yield return new object[] { "{}", new List<JObject> { new JObject() } };
            yield return new object[] { "{}{}", new List<JObject> { new JObject(), new JObject() } };

            yield return new object[] { "{'Name': 'Jose'}", new List<JObject> {
                    new()
                    {
                        { "Name", "Jose" }
                    }
                }
            };

            yield return new object[] { "{'Name': 'Jose'} {'Name': 'Carlos'}", new List<JObject> {
                    new()
                    {
                        { "Name", "Jose" }
                    },
                    new()
                    {
                        { "Name", "Carlos" }
                    }
                },
            };

            string planObjectJSON = "{ 'type':'plan','commands':[{ 'type':'DO','action':'<name>','entities':{ '<name>': '<value>' } },{ 'type':'SAY','response':'<response>'}]}";
            JObject planObject = JsonConvert.DeserializeObject<JObject>(planObjectJSON);
            yield return new object[] { planObjectJSON, new List<JObject> { planObject } };

            string twoPlanObjectsJSON = "prefix string " + planObjectJSON + "other string" + planObjectJSON + "suffix string";
            yield return new object[] { twoPlanObjectsJSON, new List<JObject> { planObject, planObject } };

        }
    }
}


