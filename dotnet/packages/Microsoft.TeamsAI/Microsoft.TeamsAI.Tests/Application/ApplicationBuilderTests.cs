using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class ApplicationBuilderTests
    {
        [Fact]
        public void Test_ApplicationBuilder_DefaultSetup()
        {
            // Act
            var app = new ApplicationBuilder<TurnState>().Build();

            // Assert
            Assert.NotEqual(null, app.Options);
            Assert.Null(app.Options.Adapter);
            Assert.Null(app.Options.BotAppId);
            Assert.Null(app.Options.Storage);
            Assert.Null(app.Options.AI);
            Assert.NotEqual(null, app.Options.TurnStateFactory);
            Assert.Null(app.Options.AdaptiveCards);
            Assert.Null(app.Options.TaskModules);
            Assert.Null(app.Options.LoggerFactory);
            Assert.Null(app.Options.Authentication);
            Assert.Equal(true, app.Options.RemoveRecipientMention);
            Assert.Equal(true, app.Options.StartTypingTimer);
            Assert.Equal(false, app.Options.LongRunningMessages);
        }

        [Fact]
        public void Test_ApplicationBuilder_CustomSetup()
        {
            // Arrange
            bool removeRecipientMention = false;
            bool longRunningMessages = true;
            bool startTypingTimer = false;
            string botAppId = "testBot";
            IStorage storage = new MemoryStorage();
            BotAdapter adapter = new SimpleAdapter();
            TestLoggerFactory loggerFactory = new();
            Func<TurnState> turnStateFactory = () => new TurnState();
            AdaptiveCardsOptions adaptiveCards = new()
            {
                ActionSubmitFilter = "cardFilter"
            };
            TaskModulesOptions taskModules = new()
            {
                TaskDataFilter = "taskFilter",
            };
            AIOptions<TurnState> aiOptions = new(new TestPlanner())
            {
                Moderator = new TestModerator()
            };
            AuthenticationOptions<TurnState> authOptions = new();
            authOptions.AddAuthentication("graph", new OAuthSettings());

            // Act
            var app = new ApplicationBuilder<TurnState>()
                .SetRemoveRecipientMention(removeRecipientMention)
                .WithStorage(storage)
                .WithAIOptions(aiOptions)
                .WithTurnStateFactory(turnStateFactory)
                .WithLongRunningMessages(adapter, botAppId)
                .WithAdaptiveCardOptions(adaptiveCards)
                .WithTaskModuleOptions(taskModules)
                .WithAuthentication(adapter, authOptions)
                .WithLoggerFactory(loggerFactory)
                .SetStartTypingTimer(startTypingTimer)
                .Build();

            // Assert
            Assert.NotNull(app.Options);
            Assert.Equal(adapter, app.Options.Adapter);
            Assert.Equal(botAppId, app.Options.BotAppId);
            Assert.Equal(storage, app.Options.Storage);
            Assert.Equal(aiOptions, app.Options.AI);
            Assert.Equal(turnStateFactory, app.Options.TurnStateFactory);
            Assert.Equal(adaptiveCards, app.Options.AdaptiveCards);
            Assert.Equal(taskModules, app.Options.TaskModules);
            Assert.Equal(authOptions, app.Options.Authentication);
            Assert.Equal(loggerFactory, app.Options.LoggerFactory);
            Assert.Equal(removeRecipientMention, app.Options.RemoveRecipientMention);
            Assert.Equal(startTypingTimer, app.Options.StartTypingTimer);
            Assert.Equal(longRunningMessages, app.Options.LongRunningMessages);
        }

        [Fact]
        public void Test_ApplicationBuilder_LongRunningMessages_ExceptionThrown()
        {
            // Arrange
            BotAdapter adapter = new SimpleAdapter();

            // Act
            var func = () =>
            {
                new ApplicationBuilder<TurnState>()
               .WithLongRunningMessages(adapter, "").Build();
            };

            // Assert
            Exception ex = Assert.Throws<ArgumentException>(() => func());
            Assert.Equal("The ApplicationOptions.LongRunningMessages property is unavailable because botAppId cannot be null or undefined.", ex.Message);
        }
    }
}
