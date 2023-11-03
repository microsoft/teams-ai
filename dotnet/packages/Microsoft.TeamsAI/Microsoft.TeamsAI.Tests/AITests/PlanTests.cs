using Microsoft.Teams.AI.AI.Planner;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class PlanTests
    {
        [Fact]
        public void Test_ToJsonString_SimpleJsonString()
        {
            // Arrange
            Plan plan = new();

            // Note: This is not a formatting error. It is formatted this way to match the expected string.
            string expectedPlanJson = @"{
  ""type"": ""plan"",
  ""commands"": []
}";
            expectedPlanJson = expectedPlanJson.ReplaceLineEndings();

            // Act
            string planJson = plan.ToJsonString().ReplaceLineEndings();

            // Assert
            Assert.Equal(expectedPlanJson, planJson);
        }

        [Fact]
        public void Test_ToJsonString_Complex()
        {
            // Arrange
            Plan plan = new();
            plan.Commands.Add(new PredictedSayCommand("Hello"));
            plan.Commands.Add(new PredictedDoCommand("DoSomething", new() { { "prop", "value" } }));

            // Note: This is not a formatting error. It is formatted this way to match the expected string.
            string expectedPlanJson = @"{
  ""type"": ""plan"",
  ""commands"": [
    {
      ""type"": ""SAY"",
      ""response"": ""Hello""
    },
    {
      ""type"": ""DO"",
      ""entities"": {
        ""prop"": ""value""
      }
    }
  ]
}";
            expectedPlanJson = expectedPlanJson.ReplaceLineEndings();

            // Act
            string planJson = plan.ToJsonString().ReplaceLineEndings();

            // Assert
            Assert.Equal(expectedPlanJson, planJson);
        }
    }
}
