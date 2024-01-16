﻿using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using System.Reflection;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class ApplicationTests
    {

        [Fact]
        public void Test_Application_DefaultSetup()
        {
            // Arrange
            ApplicationOptions<TurnState> applicationOptions = new();

            // Act
            Application<TurnState> app = new(applicationOptions);

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
            Assert.Equal(true, app.Options.RemoveRecipientMention);
            Assert.Equal(true, app.Options.StartTypingTimer);
            Assert.Equal(false, app.Options.LongRunningMessages);
        }

        [Fact]
        public void Test_Application_CustomSetup()
        {
            // Arrange
            bool removeRecipientMention = false;
            bool startTypingTimer = false;
            bool longRunningMessages = true;
            string botAppId = "testBot";
            IStorage storage = new MemoryStorage();
            SimpleAdapter adapter = new();
            TestLoggerFactory loggerFactory = new();
            Func<TurnState> turnStateFactory = () => new TurnState();
            AdaptiveCardsOptions adaptiveCardOptions = new()
            {
                ActionSubmitFilter = "cardFilter"
            };
            TaskModulesOptions taskModuleOptions = new()
            {
                TaskDataFilter = "taskFilter",
            };
            AIOptions<TurnState> aiOptions = new(new TestPlanner())
            {
                Moderator = new TestModerator()
            };
            ApplicationOptions<TurnState> applicationOptions = new()
            {
                RemoveRecipientMention = removeRecipientMention,
                StartTypingTimer = startTypingTimer,
                LongRunningMessages = longRunningMessages,
                BotAppId = botAppId,
                Storage = storage,
                Adapter = adapter,
                LoggerFactory = loggerFactory,
                TurnStateFactory = turnStateFactory,
                AdaptiveCards = adaptiveCardOptions,
                TaskModules = taskModuleOptions,
                AI = aiOptions
            };

            // Act
            Application<TurnState> app = new(applicationOptions);

            // Assert
            Assert.NotNull(app.Options);
            Assert.Equal(adapter, app.Options.Adapter);
            Assert.Equal(botAppId, app.Options.BotAppId);
            Assert.Equal(storage, app.Options.Storage);
            Assert.Equal(aiOptions, app.Options.AI);
            Assert.Equal(turnStateFactory, app.Options.TurnStateFactory);
            Assert.Equal(adaptiveCardOptions, app.Options.AdaptiveCards);
            Assert.Equal(taskModuleOptions, app.Options.TaskModules);
            Assert.Equal(loggerFactory, app.Options.LoggerFactory);
            Assert.Equal(removeRecipientMention, app.Options.RemoveRecipientMention);
            Assert.Equal(startTypingTimer, app.Options.StartTypingTimer);
            Assert.Equal(longRunningMessages, app.Options.LongRunningMessages);
        }

        [Fact]
        public void Test_StartTypingTimer_MessageActivityType()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.Message };
            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var app = new Application<TurnState>(new());

            // Act
            app.StartTypingTimer(turnContext);

            // Assert
            var timer = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);

            Assert.NotNull(timer);
            Assert.Equal(timer.GetType(), typeof(TypingTimer));
        }

        [Fact]
        public void Test_StartTypingTimer_MessageActivityType_DoubleStart_DoesNothing()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.Message };
            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var app = new Application<TurnState>(new());

            // Act 1
            app.StartTypingTimer(turnContext);

            // Assert 1
            var timer1 = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);

            Assert.NotNull(timer1);
            Assert.Equal(timer1.GetType(), typeof(TypingTimer));

            // Act 2
            app.StartTypingTimer(turnContext);

            // Assert 2
            var timer2 = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);

            Assert.NotNull(timer2);
            Assert.Equal(timer2.GetType(), typeof(TypingTimer));
            Assert.Equal(timer2, timer2);
        }

        [Fact]
        public void Test_StartTypingTimer_NonMessageActivityType_DoesNothing()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageUpdate };
            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var app = new Application<TurnState>(new());

            // Act
            app.StartTypingTimer(turnContext);

            // Assert
            var timer = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);
            Assert.Null(timer);
        }

        [Fact]
        public void Test_StopTypingTimer_WithoutEverStartingTypingTimer()
        {
            // Arrange
            var app = new Application<TurnState>(new());

            // Act
            app.StopTypingTimer();

            // Assert
            var timer = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);

            Assert.Null(timer);
        }

        [Fact]
        public void Test_Start_Then_StopTypingTimer_MessageActivityType_DisposesTypingTimer()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageUpdate };
            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var app = new Application<TurnState>(new());

            // Act
            app.StartTypingTimer(turnContext);
            app.StopTypingTimer();

            // Assert
            var timer = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);
            Assert.Null(timer);
        }

        [Fact]
        public async Task Test_TurnEventHandler_BeforeTurn_AfterTurn()
        {
            // Arrange
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnContext.Activity.Type = "message";

            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var messages = new List<string>();
            app.OnBeforeTurn((context, _, _) =>
            {
                messages.Add(context.Activity?.Text ?? string.Empty);
                return Task.FromResult(true);
            });
            app.OnAfterTurn((context, _, _) =>
            {
                messages.Add(context.Activity?.Text ?? string.Empty);
                return Task.FromResult(true);
            });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(2, messages.Count);
            Assert.Equal("hello", messages[0]);
            Assert.Equal("hello", messages[1]);
        }

        [Fact]
        public async Task Test_TurnEventHandler_BeforeTurn_ReturnsFalse()
        {
            // Arrange
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnContext.Activity.Type = "message";

            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var messages = new List<string>();
            app.OnBeforeTurn((context, _, _) =>
            {
                messages.Add(context.Activity?.Text ?? string.Empty);
                return Task.FromResult(false);
            });
            app.OnAfterTurn((context, _, _) =>
            {
                messages.Add(context.Activity?.Text ?? string.Empty);
                return Task.FromResult(true);
            });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(messages);
            Assert.Equal("hello", messages[0]);
        }

        [Fact]
        public async Task Test_TurnEventHandler_AfterTurn_ReturnsFalse()
        {
            // Arrange
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnContext.Activity.Type = "message";
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var messages = new List<string>();
            app.OnBeforeTurn((context, _, _) =>
            {
                messages.Add(context.Activity?.Text ?? string.Empty);
                return Task.FromResult(true);
            });
            app.OnAfterTurn((context, _, _) =>
            {
                messages.Add(context.Activity?.Text ?? string.Empty);
                return Task.FromResult(false);
            });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(2, messages.Count);
            Assert.Equal("hello", messages[0]);
            Assert.Equal("hello", messages[1]);
        }
    }
}
