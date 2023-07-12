using Microsoft.TeamsAI.Tests.TestUtils;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Bot.Schema;
using Microsoft.Rest.Serialization;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.TeamsAI.State;
using Microsoft.Bot.Builder;

namespace Microsoft.TeamsAI.Tests.ActivityHandlerTests
{
    public class ConversationUpdateActivityTests
    {
        [Fact]
        public async Task Test_ConversationUpdateActivity_One_MemberAdded()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "b" },
                },
                Recipient = new ChannelAccount { Id = "b" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_Two_MembersAdded()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "a" },
                    new ChannelAccount { Id = "b" },
                },
                Recipient = new ChannelAccount { Id = "b" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_One_MemberRemoved()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersRemoved = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "c" },
                },
                Recipient = new ChannelAccount { Id = "c" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_Two_MembersRemoved()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersRemoved = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "a" },
                    new ChannelAccount { Id = "c" },
                },
                Recipient = new ChannelAccount { Id = "c" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersRemovedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_Bot_MemberAdded()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "b" },
                },
                Recipient = new ChannelAccount { Id = "b" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_Bot_MemberRemoved()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersRemoved = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "c" },
                },
                Recipient = new ChannelAccount { Id = "c" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_BotTeamsMemberAdded()
        {
            // Arrange
            var connectorClient = new ConnectorClient(new Uri("http://localhost/"), new MicrosoftAppCredentials(string.Empty, string.Empty));

            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "bot" },
                },
                Recipient = new ChannelAccount { Id = "bot" },
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamMemberAdded",
                    Team = new TeamInfo
                    {
                        Id = "team-id",
                    },
                },
                ChannelId = Channels.Msteams,
            };

            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            turnContext.TurnState.Add<IConnectorClient>(connectorClient);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[2]); // This is the Teams specific handler
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsMemberAdded()
        {
            // Arrange
            var baseUri = new Uri("https://test.coffee");
            var customHttpClient = new HttpClient(new RosterHttpMessageHandler());

            // Set a special base address so then we can make sure the connector client is honoring this http client
            customHttpClient.BaseAddress = baseUri;
            var connectorClient = new ConnectorClient(new Uri("http://localhost/"), new MicrosoftAppCredentials(string.Empty, string.Empty), customHttpClient);

            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "id-1" },
                },
                Recipient = new ChannelAccount { Id = "b" },
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamMemberAdded",
                    Team = new TeamInfo
                    {
                        Id = "team-id",
                    },
                },
                ChannelId = Channels.Msteams,
            };

            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            turnContext.TurnState.Add<IConnectorClient>(connectorClient);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[2]); // This is the Teams specific handler
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsMemberAddedNoTeam()
        {
            // Arrange
            var baseUri = new Uri("https://test.coffee");
            var customHttpClient = new HttpClient(new RosterHttpMessageHandler());

            // Set a special base address so then we can make sure the connector client is honoring this http client
            customHttpClient.BaseAddress = baseUri;
            var connectorClient = new ConnectorClient(new Uri("http://localhost/"), new MicrosoftAppCredentials(string.Empty, string.Empty), customHttpClient);

            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "id-1" },
                },
                Recipient = new ChannelAccount { Id = "b" },
                Conversation = new ConversationAccount { Id = "conversation-id" },
                ChannelId = Channels.Msteams,
            };

            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            turnContext.TurnState.Add<IConnectorClient>(connectorClient);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[2]); // This is the Teams specific handler
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsMemberAddedFullDetailsInEvent()
        {
            // Arrange
            var baseUri = new Uri("https://test.coffee");
            var customHttpClient = new HttpClient(new RosterHttpMessageHandler());

            // Set a special base address so then we can make sure the connector client is honoring this http client
            customHttpClient.BaseAddress = baseUri;
            var connectorClient = new ConnectorClient(new Uri("http://localhost/"), new MicrosoftAppCredentials(string.Empty, string.Empty), customHttpClient);

            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new TeamsChannelAccount
                    {
                        Id = "id-1",
                        Name = "name-1",
                        AadObjectId = "aadobject-1",
                        Email = "test@microsoft.com",
                        GivenName = "given-1",
                        Surname = "surname-1",
                        UserPrincipalName = "t@microsoft.com",
                    },
                },
                Recipient = new ChannelAccount { Id = "b" },
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamMemberAdded",
                    Team = new TeamInfo
                    {
                        Id = "team-id",
                    },
                },
                ChannelId = Channels.Msteams,
            };

            // code taken from connector - i.e. the send or serialize side
            var serializationSettings = new JsonSerializerSettings();
            serializationSettings.ContractResolver = new DefaultContractResolver();
            var json = SafeJsonConvert.SerializeObject(activity, serializationSettings);

            // code taken from integration layer - i.e. the receive or deserialize side
            var botMessageSerializer = JsonSerializer.Create(new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore,
                Formatting = Formatting.Indented,
                DateFormatHandling = DateFormatHandling.IsoDateFormat,
                DateTimeZoneHandling = DateTimeZoneHandling.Utc,
                ReferenceLoopHandling = ReferenceLoopHandling.Serialize,
                ContractResolver = new ReadOnlyJsonContractResolver(),
                Converters = new List<JsonConverter> { new Iso8601TimeSpanConverter() },
            });

            using (var bodyReader = new JsonTextReader(new StringReader(json)))
            {
                activity = botMessageSerializer.Deserialize<Activity>(bodyReader);
            }

            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            turnContext.TurnState.Add<IConnectorClient>(connectorClient);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[2]); // This is the Teams specific handler
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsMemberRemoved()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersRemoved = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "a" },
                },
                Recipient = new ChannelAccount { Id = "b" },
                ChannelData = new TeamsChannelData { EventType = "teamMemberRemoved" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersRemovedAsync", bot.Record[1]);
            Assert.Equal("OnMembersRemovedAsync", bot.Record[2]); // This is the Teams specific handler
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsChannelCreated()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "channelCreated" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnChannelCreatedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsChannelDeleted()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "channelDeleted" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnChannelDeletedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsChannelRenamed()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "channelRenamed" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnChannelRenamedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsChannelRestored()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "channelRestored" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnChannelRestoredAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsTeamArchived()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "teamArchived" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnTeamArchivedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsTeamDeleted()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "teamDeleted" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnTeamDeletedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsTeamHardDeleted()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "teamHardDeleted" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnTeamHardDeletedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsTeamRenamed()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "teamRenamed" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnTeamRenamedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsTeamRestored()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "teamRestored" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnTeamRestoredAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_TeamsTeamUnarchived()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData { EventType = "teamUnarchived" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnTeamUnarchivedAsync", bot.Record[1]);
        }
    }
}
