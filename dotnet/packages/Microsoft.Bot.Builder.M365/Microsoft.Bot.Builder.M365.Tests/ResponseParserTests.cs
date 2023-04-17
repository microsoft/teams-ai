using Newtonsoft.Json;
using AdaptiveCards;
using Microsoft.Bot.Builder.M365.AI;

namespace Microsoft.Bot.Builder.M365.Tests
{
    public class ResponseParserTests
    {
        [Theory]
        [MemberData(nameof(ParseJsonTestData))]
        public void Test_ParseJson_Simple(string text, List<string> expectedJSONs)
        {
            // Arange - done through parameters

            // Act
            var actualObjects = ResponseParser.ParseJSON(text);

            // Assert
            Assert.Equal(expectedJSONs, actualObjects);
        }

        [Fact]
        public void Test_ParseAdaptiveCard_Simple()
        {
            // Arrange 
            var adaptiveCardJSON = @"{
                  ""type"": ""AdaptiveCard"",
                  ""version"": ""1.4"",
                  ""body"": []
                }";

            AdaptiveCard expectedAdaptiveCard = AdaptiveCard.FromJson(adaptiveCardJSON).Card;

            // Act
            AdaptiveCardParseResult? adaptiveCardParseResult = ResponseParser.ParseAdaptiveCard(adaptiveCardJSON);
            AdaptiveCard adaptiveCard = adaptiveCardParseResult!.Card;

            // Assert
            Assert.NotNull(adaptiveCard);
            Assert.Equal(expectedAdaptiveCard.Type, adaptiveCard.Type);
            Assert.Equal(expectedAdaptiveCard.Version, adaptiveCard.Version);
            Assert.Equal(expectedAdaptiveCard.Body.Count, adaptiveCard.Body.Count);
        }

        [Fact]
        public void Test_ParsePlan_No_Commands()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Empty(responsePlan.Commands);
        }

        [Fact]
        public void Test_ParsePlan_One_DoCommand_Empty_Entities_Property()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{'type':'DO','action':'actionValue','entities':{}}]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Single(responsePlan.Commands);
            
            PredictedDoCommand predictedDoCommand = (PredictedDoCommand)responsePlan.Commands.First();
            Assert.Empty(predictedDoCommand.Entities);
            Assert.Equal("actionValue", predictedDoCommand.Action);
        }

        [Fact]
        public void Test_ParsePlan_One_DoCommand_No_Entities_Property()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{'type':'DO','action':'actionValue'}]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Single(responsePlan.Commands);

            PredictedDoCommand predictedDoCommand = (PredictedDoCommand)responsePlan.Commands.First();
            Assert.Null(predictedDoCommand.Entities);
            Assert.Equal("actionValue", predictedDoCommand.Action);
        }

        [Fact]
        public void Test_ParsePlan_One_DoCommand_One_Entity()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{'type':'DO','action':'actionValue','entities':{ 'entityName': 'entityValue' }}]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);


            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Single(responsePlan.Commands);

            PredictedDoCommand predictedDoCommand = (PredictedDoCommand)responsePlan.Commands.First();
            Assert.Equal("actionValue", predictedDoCommand.Action);
            Assert.Single(predictedDoCommand.Entities);
            Assert.Equal("entityValue", predictedDoCommand.Entities["entityName"]);
        }

        [Fact]
        public void Test_ParsePlan_One_DoCommand_Multiple_Entities()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{'type':'DO','action':'actionValue','entities':{ 'entityNameA': 'entityValueA', 'entityNameB': 'entityValueB' }}]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Single(responsePlan.Commands);

            PredictedDoCommand predictedDoCommand = (PredictedDoCommand)responsePlan.Commands.First();
            Assert.Equal("actionValue", predictedDoCommand.Action);
            Assert.Equal(2, predictedDoCommand.Entities.Count);
            Assert.Equal("entityValueA", predictedDoCommand.Entities["entityNameA"]);
            Assert.Equal("entityValueB", predictedDoCommand.Entities["entityNameB"]);
        }

        [Fact]
        public void Test_ParsePlan_Multiple_DoCommands_No_Entities()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{'type':'DO','action':'actionValueA'}, {'type': 'DO', 'action':'actionValueB'}]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);


            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Equal(2, responsePlan.Commands.Count);

            PredictedDoCommand firstDoCommand = (PredictedDoCommand)responsePlan.Commands.First();
            Assert.Equal("actionValueA", firstDoCommand.Action);
            PredictedDoCommand secondDoCommand = (PredictedDoCommand)responsePlan.Commands.ElementAt(1);
            Assert.Equal("actionValueB", secondDoCommand.Action);
        }

        [Fact]
        public void Test_ParsePlan_One_SayCommand()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{'type':'SAY','response':'responseValue'}]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Single(responsePlan.Commands);

            PredictedSayCommand predictedSayCommand = (PredictedSayCommand)responsePlan.Commands.First();
            Assert.Equal("responseValue", predictedSayCommand.Response);
        }

        [Fact]
        public void Test_ParsePlan_Multiple_SayCommands()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{'type':'SAY','response':'responseValueA'}, {'type':'SAY','response':'responseValueB'}]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Equal(2, responsePlan.Commands.Count);

            PredictedSayCommand firstSayCommand = (PredictedSayCommand)responsePlan.Commands.First();
            Assert.Equal("responseValueA", firstSayCommand.Response);
            PredictedSayCommand secondSayCommand = (PredictedSayCommand)responsePlan.Commands.ElementAt(1);
            Assert.Equal("responseValueB", secondSayCommand.Response);
        }

        [Fact]
        public void Test_ParsePlan_Multiple_Commands_One_SayCommand_And_One_DoCommand()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{'type':'SAY','response':'responseValue'}, {'type':'Do','action':'actionValue'}]}";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Equal(2, responsePlan.Commands.Count);

            PredictedSayCommand firstCommand = (PredictedSayCommand)responsePlan.Commands.First();
            Assert.Equal("responseValue", firstCommand.Response);
            PredictedDoCommand secondCommand = (PredictedDoCommand)responsePlan.Commands.ElementAt(1);
            Assert.Equal("actionValue", secondCommand.Action);
        }

        [Fact]
        public void Test_ParsePlan_Invalid_Format_Type_IsNot_Plan()
        {
            // Arrange 
            var planJSON = @"{ 'type':'notPlan','commands':[] }";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert - returns empty plan
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Empty(responsePlan.Commands);
        }

        [Fact]
        public void Test_ParsePlan_Invalid_Format_NonExistentCommand()
        {
            // Arrange 
            var planJSON = @"{ 'type':'plan','commands':[{ type: 'newCommand' }] }";

            // Act
            Action action = () => ResponseParser.ParseResponse(planJSON);

            // Act & Assert
            JsonSerializationException ex = Assert.Throws<JsonSerializationException>(action);
            Assert.Equal("Unknown command type `newCommand`", ex.Message);
        }

        [Fact]
        public void Test_ParsePlan_NonSpecificJSONText()
        {
            // Arrange 
            var planJSON = @"Here's your plan: { 'type':'plan','commands':[] }, you're welcome.";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(planJSON);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Empty(responsePlan.Commands);
        }

        [Fact]
        public void Test_ParsePlan_NonJSON_Response_No_Commands()
        {
            // Arrange 
            var responseText = @"I'm sorry we could not generate a plan";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(responseText);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Single(responsePlan.Commands);

            PredictedSayCommand predictedSayCommand = (PredictedSayCommand)responsePlan.Commands.First();
            Assert.Equal(responseText, predictedSayCommand.Response);
        }

        [Fact]
        public void Test_ParsePlan_NonJSON_Response_DO_Command()
        {
            // Arrange 
            var responseText = @"DO 'actionValue'";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(responseText);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Single(responsePlan.Commands);

            PredictedDoCommand predictedDoCommand = (PredictedDoCommand)responsePlan.Commands.First();
            Assert.Equal("actionValue", predictedDoCommand.Action);
        }

        [Fact]
        public void Test_ParsePlan_NonJSON_Response_SAY_Command()
        {
            // Arrange 
            var responseText = @"SAY this is a say command response";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(responseText);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Single(responsePlan.Commands);

            PredictedSayCommand predictedSayCommand = (PredictedSayCommand)responsePlan.Commands.First();
            Assert.Equal(" this is a say command response", predictedSayCommand.Response);
        }

        [Fact]
        public void Test_ParsePlan_NonJSON_Response_DO_then_SAY_Commands()
        {
            // Arrange 
            var responseText = @"DO actionName THEN SAY responseValue";

            // Act
            Plan responsePlan = ResponseParser.ParseResponse(responseText);

            // Assert
            Assert.Equal(AITypes.Plan, responsePlan.Type);
            Assert.Equal(2, responsePlan.Commands.Count);

            PredictedDoCommand predictedDoCommand = (PredictedDoCommand)responsePlan.Commands.First();
            Assert.Equal("actionName", predictedDoCommand.Action);
            PredictedSayCommand predictedSayCommand = (PredictedSayCommand)responsePlan.Commands.ElementAt(1);
            Assert.Equal(" responseValue", predictedSayCommand.Response);
        }

        [Fact]
        public void Test_TokenizeText_Simple_DoCommand()
        {
            // Arrange 
            var planText = @"DO action='actionValue'";
            List<string> actualTokens = new() { "DO", " ", "action", "=", "'", "actionValue", "'" };

            // Act
            List<string> expectedTokens = ResponseParser.TokenizeText(planText);

            // Assert
            Assert.Equal(expectedTokens, actualTokens);
        }


        [Fact]
        public void Test_TokenizeText_Simple_SayCommand()
        {
            // Arrange 
            var planText = @"SAY response='responseValue'";
            List<string> actualTokens = new() { "SAY", " ", "response", "=", "'", "responseValue", "'" };

            // Act
            List<string> expectedTokens = ResponseParser.TokenizeText(planText);

            // Assert
            Assert.Equal(expectedTokens, actualTokens);
        }

        public static IEnumerable<object[]> ParseJsonTestData()
        {
            yield return new object[] { "{}", new List<string> { "{}" } };
            yield return new object[] { "{}{}", new List<string> { "{}", "{}" } };

            yield return new object[] { "{'Name': 'Jose'}", new List<string> {
                    "{'Name': 'Jose'}"
                }
            };

            yield return new object[] { "{'Name': 'Jose'} {'Name': 'Carlos'}", new List<string> {
                    "{'Name': 'Jose'}",
                    "{'Name': 'Carlos'}"
                },
            };

            string planObjectJSON = "{ 'type':'plan','commands':[{ 'type':'DO','action':'<name>','entities':{ '<name>': '<value>' } },{ 'type':'SAY','response':'<response>'}]}";
            yield return new object[] { planObjectJSON, new List<string> { planObjectJSON } };

            string twoPlanObjectsJSON = "prefix string " + planObjectJSON + "other string" + planObjectJSON + "suffix string";
            yield return new object[] { twoPlanObjectsJSON, new List<string> { planObjectJSON, planObjectJSON } };

        }
    }
}


