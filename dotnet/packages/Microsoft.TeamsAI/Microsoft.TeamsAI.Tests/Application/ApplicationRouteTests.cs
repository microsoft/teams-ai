using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using NewApp = Microsoft.TeamsAI.Application;
using Microsoft.TeamsAI.Tests.TestUtils;

namespace Microsoft.TeamsAI.Tests.Application
{
    public class ApplicationRouteTests
    {
        [Fact]
        public async Task Test_Application_Route()
        {
            // Arrange
            var activity1 = MessageFactory.Text("hello.1");
            var activity2 = MessageFactory.Text("hello.2");

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnState = new TestTurnState();
            var app = new NewApp.Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
            });
            var messages = new List<string>();
            app.AddRoute(
                (context, _) =>
                Task.FromResult(string.Equals("hello.1", context.Activity.Text)),
                (context, _, _) =>
                {
                    messages.Add(context.Activity.Text);
                    return Task.CompletedTask;
                },
                false);

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);

            // Assert
            Assert.Single(messages);
            Assert.Equal("hello.1", messages[0]);
        }

        [Fact]
        public async Task Test_Application_Routes_Are_Called_InOrder()
        {
            // Arrange
            var activity = MessageFactory.Text("hello.1");
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TestTurnState();
            var app = new NewApp.Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
            });
            var selectedRoutes = new List<int>();
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("hello", context.Activity.Text)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(0);
                    return Task.CompletedTask;
                },
                false);
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("hello.1", context.Activity.Text)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(1);
                    return Task.CompletedTask;
                },
                false);
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(2);
                    return Task.CompletedTask;
                },
                false);

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(selectedRoutes);
            Assert.Equal(1, selectedRoutes[0]);
        }

        [Fact]
        public async Task Test_Application_InvokeRoute()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.1",
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.2",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnState = new TestTurnState();
            var app = new NewApp.Application<TestTurnState, TestTurnStateManager>(new()
            {
                StartTypingTimer = false
            });
            var names = new List<string>();
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("invoke.1", context.Activity.Name)),
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                },
                true);

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);

            // Assert
            Assert.Single(names);
            Assert.Equal("invoke.1", names[0]);
        }

        [Fact]
        public async Task Test_Application_InvokeRoutes_Are_Called_InOrder()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.1"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TestTurnState();
            var app = new NewApp.Application<TestTurnState, TestTurnStateManager>(new()
            {
                StartTypingTimer = false
            });
            var selectedRoutes = new List<int>();
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("invoke", context.Activity.Name)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(0);
                    return Task.CompletedTask;
                },
                true);
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("invoke.1", context.Activity.Name)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(1);
                    return Task.CompletedTask;
                },
                true);
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(2);
                    return Task.CompletedTask;
                },
                true);

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(selectedRoutes);
            Assert.Equal(1, selectedRoutes[0]);
        }

        [Fact]
        public async Task Test_Application_InvokeRoutes_Are_Called_First()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.1"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TestTurnState();
            var app = new NewApp.Application<TestTurnState, TestTurnStateManager>(new()
            {
                StartTypingTimer = false
            });
            var selectedRoutes = new List<int>();
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(0);
                    return Task.CompletedTask;
                },
                true);
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(1);
                    return Task.CompletedTask;
                },
                false);

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(selectedRoutes);
            Assert.Equal(0, selectedRoutes[0]);
        }

        [Fact]
        public async Task Test_Application_No_InvokeRoute_Matched_Fallback_To_Routes()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.1"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TestTurnState();
            var app = new NewApp.Application<TestTurnState, TestTurnStateManager>(new()
            {
                StartTypingTimer = false
            });
            var selectedRoutes = new List<int>();
            app.AddRoute(
                (_, _) => Task.FromResult(false),
                (context, _, _) =>
                {
                    selectedRoutes.Add(0);
                    return Task.CompletedTask;
                },
                true);
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("invoke.1", context.Activity.Name)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(1);
                    return Task.CompletedTask;
                },
                false);
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(2);
                    return Task.CompletedTask;
                },
                false);

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(selectedRoutes);
            Assert.Equal(1, selectedRoutes[0]);
        }
    }
}
