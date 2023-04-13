// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Connector;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema;
using Moq;
using Newtonsoft.Json.Linq;
using Microsoft.Bot.Builder.M365.Tests.TestUtils;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Rest.Serialization;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;

namespace Microsoft.Bot.Builder.M365.Tests
{
    public class ActivityHandlerTests
    {
        [Fact]
        public async Task Test_MessageActivity()
        {
            // Arrange
            var activity = MessageFactory.Text("hello");
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageUpdate };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity_MessageEdit()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelData = new TeamsChannelData { EventType = "editMessage" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessageEditAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity_MessageUndelete()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelData = new TeamsChannelData { EventType = "undeleteMessage" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessageUndeleteAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity_MessageUndelete_NoMsteams()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelData = new TeamsChannelData { EventType = "undeleteMessage" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity_NoChannelData()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageDeleteActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageDelete };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageDeleteActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageDeleteActivity_MessageSoftDelete()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelData = new TeamsChannelData { EventType = "softDeleteMessage" },
                ChannelId = Channels.Msteams
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnMessageDeleteActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessageSoftDeleteAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_MessageDeleteActivity_MessageSoftDelete_NoMsteams()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelData = new TeamsChannelData { EventType = "softMessage" }
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageDeleteActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageDeleteActivity_NoChannelData()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageDeleteActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_EndOfConversationActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.EndOfConversation, Value = "some value" };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnEndOfConversationActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_TypingActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.Typing };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnTypingActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.InstallationUpdate };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
        }

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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersRemovedAsync", bot.Record[1]);
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
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
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnTeamUnarchivedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_MessageReactionActivity_ReactionAdded_And_ReactionRemoved()
        {
            // Note the code supports multiple adds and removes in the same activity though
            // a channel may decide to send separate activities for each. For example, Teams
            // sends separate activities each with a single add and a single remove.

            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageReaction,
                ReactionsAdded = new List<MessageReaction>
                {
                    new MessageReaction("sad"),
                },
                ReactionsRemoved = new List<MessageReaction>
                {
                    new MessageReaction("angry"),
                },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnMessageReactionActivityAsync", bot.Record[0]);
            Assert.Equal("OnReactionsAddedAsync", bot.Record[1]);
            Assert.Equal("OnReactionsRemovedAsync", bot.Record[2]);
        }

        [Fact]
        public async Task Test_EventActivity_TokenResponseEventAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Event,
                Name = SignInConstants.TokenResponseEventName,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnTokenResponseEventAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_EventActvitiy_EventAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Event,
                Name = "some.random.event",
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnEventAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InvokeActivity()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "some.random.invoke",
            };

            var adapter = new TestInvokeAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal(200, ((InvokeResponse)((Activity)adapter.Activity).Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_SignInTokenExchangeAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = SignInConstants.TokenExchangeOperationName,
            };
            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSignInInvokeAsync", bot.Record[1]);
            Assert.Equal("OnSignInTokenExchangeAsync", bot.Record[2]);

        }

        [Fact]
        public async Task Test_InvokeActivity_InvokeShouldNotMatchAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "should.not.match",
            };
            var adapter = new TestInvokeAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal(501, ((InvokeResponse)((Activity)adapter.Activity).Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_FileConsentAccept()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new FileConsentCardResponse
                {
                    Action = "accept",
                    UploadInfo = new FileUploadInfo
                    {
                        UniqueId = "uniqueId",
                        FileType = "fileType",
                        UploadUrl = "uploadUrl",
                    },
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnFileConsentAsync", bot.Record[1]);
            Assert.Equal("OnFileConsentAcceptAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_FileConsentDecline()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new FileConsentCardResponse
                {
                    Action = "decline",
                    UploadInfo = new FileUploadInfo
                    {
                        UniqueId = "uniqueId",
                        FileType = "fileType",
                        UploadUrl = "uploadUrl",
                    },
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnFileConsentAsync", bot.Record[1]);
            Assert.Equal("OnFileConsentDeclineAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_ActionableMessageExecuteAction()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "actionableMessage/executeAction",
                Value = JObject.FromObject(new O365ConnectorCardActionQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnO365ConnectorCardActionAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_ComposeExtensionQueryLink()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/queryLink",
                Value = JObject.FromObject(new AppBasedLinkQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnAppBasedLinkQueryAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_ComposeExtensionAnonymousQueryLink()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/anonymousQueryLink",
                Value = JObject.FromObject(new AppBasedLinkQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnAnonymousAppBasedLinkQueryAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_ComposeExtensionQuery()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
                Value = JObject.FromObject(new MessagingExtensionQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionQueryAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSelectItemAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/selectItem",
                Value = new JObject(),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionSelectItemAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitAction()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new MessagingExtensionQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionSubmitActionDispatchAsync", bot.Record[1]);
            Assert.Equal("OnMessagingExtensionSubmitActionAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitActionPreviewActionEdit()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new MessagingExtensionAction
                {
                    BotMessagePreviewAction = "edit",
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionSubmitActionDispatchAsync", bot.Record[1]);
            Assert.Equal("OnMessagingExtensionBotMessagePreviewEditAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitActionPreviewActionSend()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new MessagingExtensionAction
                {
                    BotMessagePreviewAction = "send",
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionSubmitActionDispatchAsync", bot.Record[1]);
            Assert.Equal("OnMessagingExtensionBotMessagePreviewSendAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionFetchTask()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/fetchTask",
                Value = JObject.Parse(@"{""commandId"":""testCommand""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionFetchTaskAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionConfigurationQuerySettingUrl()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/querySettingUrl",
                Value = JObject.Parse(@"{""commandId"":""testCommand""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionConfigurationQuerySettingUrlAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionConfigurationSetting()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/setting",
                Value = JObject.Parse(@"{""commandId"":""testCommand""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionConfigurationSettingAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_TaskModuleFetch()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "task/fetch",
                Value = JObject.Parse(@"{""data"":{""key"":""value"",""type"":""task / fetch""},""context"":{""theme"":""default""}}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnTaskModuleFetchAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_TaskModuleSubmit()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "task/submit",
                Value = JObject.Parse(@"{""data"":{""key"":""value"",""type"":""task / fetch""},""context"":{""theme"":""default""}}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnTaskModuleSubmitAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_TabFetch()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "tab/fetch",
                Value = JObject.Parse(@"{""data"":{""key"":""value"",""type"":""tab / fetch""},""context"":{""theme"":""default""}}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnTabFetchAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_TabSubmit()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "tab/submit",
                Value = JObject.Parse(@"{""data"":{""key"":""value"",""type"":""tab / submit""},""context"":{""theme"":""default""}}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnTabSubmitAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_SigninVerifyState()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "signin/verifyState",
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSignInInvokeAsync", bot.Record[1]);
            Assert.Equal("OnSignInVerifyStateAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_EventActivity()
        {
            // Arrange
            var activity = new Activity
            {
                ChannelId = Channels.Directline,
                Type = ActivityTypes.Event
            };

            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnEventAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_EventActivity_MeetingStartEvent()
        {
            // Arrange
            var activity = new Activity
            {
                ChannelId = Channels.Msteams,
                Type = ActivityTypes.Event,
                Name = "application/vnd.microsoft.meetingStart",
                Value = JObject.Parse(@"{""StartTime"":""2021-06-05T00:01:02.0Z""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnMeetingStartAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.Contains("12:01:02 AM", activitiesToSend[0].Text); // Date format differs between OSs, so we just Assert.Contains instead of Assert.Equals
        }

        [Fact]
        public async Task Test_EventActivity_MeetingEndEvent()
        {
            // Arrange
            var activity = new Activity
            {
                ChannelId = Channels.Msteams,
                Type = ActivityTypes.Event,
                Name = "application/vnd.microsoft.meetingEnd",
                Value = JObject.Parse(@"{""EndTime"":""2021-06-05T01:02:03.0Z""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnMeetingEndAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.Contains("1:02:03 AM", activitiesToSend[0].Text); // Date format differs between OSs, so we just Assert.Contains instead of Assert.Equals
        }

        [Fact]
        public async Task Test_EventActivity_ReadReceiptEvent()
        {
            // Arrange
            var activity = new Activity
            {
                ChannelId = Channels.Msteams,
                Type = ActivityTypes.Event,
                Name = "application/vnd.microsoft.readReceipt",
                Value = JObject.Parse(@"{""lastReadMessageId"":""10101010""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnReadReceiptAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.Equal("10101010", activitiesToSend[0].Text);
        }

        [Fact]
        public async Task Test_EventActivity_EventNullNameAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Event,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnEventAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity_AddAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.InstallationUpdate,
                Action = "add"
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateAddAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity_AddUpgradeAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.InstallationUpdate,
                Action = "add-upgrade"
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateAddAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity_RemoveAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.InstallationUpdate,
                Action = "remove"
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateRemoveAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity_RemoveUpgradeAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.InstallationUpdate,
                Action = "remove-upgrade"
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateRemoveAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InvokeActivity_OnAdaptiveCardActionExecuteAsync()
        {
            var value = JObject.FromObject(new AdaptiveCardInvokeValue { Action = new AdaptiveCardInvokeAction { Type = "Action.Execute" } });

            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "adaptiveCard/action",
                Value = value
            };

            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnAdaptiveCardActionExecuteAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_CommandActivityType()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Command,
                Name = "application/test",
                Value = new CommandValue<object> { CommandId = "Test", Data = new { test = true } }
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnCommandActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_CommandResultActivityType()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.CommandResult,
                Name = "application/test",
                Value = new CommandResultValue<object> { CommandId = "Test", Data = new { test = true } }
            };

            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnCommandResultActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_UnrecognizedActivityType()
        {
            // Arrange
            var activity = new Activity
            {
                Type = "shall.not.pass",
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnUnrecognizedActivityTypeAsync", bot.Record[0]);
        }

        [Fact]
        public async Task TestDelegatingTurnContext()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            turnContextMock.Setup(tc => tc.Activity).Returns(new Activity { Type = ActivityTypes.Message });
            turnContextMock.Setup(tc => tc.Adapter).Returns(new BotFrameworkAdapter(new SimpleCredentialProvider()));
            turnContextMock.Setup(tc => tc.TurnState).Returns(new TurnContextStateCollection());
            turnContextMock.Setup(tc => tc.Responded).Returns(false);
            turnContextMock.Setup(tc => tc.OnDeleteActivity(It.IsAny<DeleteActivityHandler>()));
            turnContextMock.Setup(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()));
            turnContextMock.Setup(tc => tc.OnUpdateActivity(It.IsAny<UpdateActivityHandler>()));
            turnContextMock.Setup(tc => tc.SendActivityAsync(It.IsAny<IActivity>(), It.IsAny<CancellationToken>())).Returns(Task.FromResult(new ResourceResponse()));
            turnContextMock.Setup(tc => tc.SendActivitiesAsync(It.IsAny<IActivity[]>(), It.IsAny<CancellationToken>())).Returns(Task.FromResult(new[] { new ResourceResponse() }));
            turnContextMock.Setup(tc => tc.DeleteActivityAsync(It.IsAny<ConversationReference>(), It.IsAny<CancellationToken>())).Returns(Task.FromResult(new ResourceResponse()));
            turnContextMock.Setup(tc => tc.UpdateActivityAsync(It.IsAny<IActivity>(), It.IsAny<CancellationToken>())).Returns(Task.FromResult(new ResourceResponse()));
            var turnState = new TurnState();

            // Act
            var bot = new TestDelegatingTurnContext(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContextMock.Object, turnState, default);

            // Assert
            turnContextMock.VerifyGet(tc => tc.Activity, Times.AtLeastOnce);
            turnContextMock.VerifyGet(tc => tc.Adapter, Times.Once);
            turnContextMock.VerifyGet(tc => tc.TurnState, Times.Once);
            turnContextMock.VerifyGet(tc => tc.Responded, Times.Once);
            turnContextMock.Verify(tc => tc.OnDeleteActivity(It.IsAny<DeleteActivityHandler>()), Times.Once);
            turnContextMock.Verify(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()), Times.Once);
            turnContextMock.Verify(tc => tc.OnUpdateActivity(It.IsAny<UpdateActivityHandler>()), Times.Once);
            turnContextMock.Verify(tc => tc.SendActivityAsync(It.IsAny<IActivity>(), It.IsAny<CancellationToken>()), Times.Once);
            turnContextMock.Verify(tc => tc.SendActivitiesAsync(It.IsAny<IActivity[]>(), It.IsAny<CancellationToken>()), Times.Once);
            turnContextMock.Verify(tc => tc.DeleteActivityAsync(It.IsAny<ConversationReference>(), It.IsAny<CancellationToken>()), Times.Once);
            turnContextMock.Verify(tc => tc.UpdateActivityAsync(It.IsAny<IActivity>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Test_InvokeActivity_OnSearchInvokeAsync()
        {
            // Arrange
            var value = JObject.FromObject(new SearchInvokeValue { Kind = SearchInvokeTypes.Search, QueryText = "bot" });
            var activity = GetSearchActivity(value);
            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSearchInvokeAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InvokeActivity_OnSearchInvokeAsync_NoKindOnTeamsDefaults()
        {
            // Arrange
            var value = JObject.FromObject(new SearchInvokeValue { Kind = null, QueryText = "bot" });
            var activity = GetSearchActivity(value);
            activity.ChannelId = Channels.Msteams;
            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSearchInvokeAsync", bot.Record[1]);
        }

        [Fact]
        public async Task TestGetSearchInvokeValue_NullValueThrows()
        {
            var activity = GetSearchActivity(null);
            await AssertErrorThroughInvokeAdapter(activity, "Missing value property for search");
        }

        [Fact]
        public async Task TestGetSearchInvokeValue_InvalidValueThrows()
        {
            var activity = GetSearchActivity(new object());
            await AssertErrorThroughInvokeAdapter(activity, "Value property is not properly formed for search");
        }

        [Fact]
        public async Task TestGetSearchInvokeValue_MissingKindThrows()
        {
            var activity = GetSearchActivity(JObject.FromObject(new SearchInvokeValue { Kind = null, QueryText = "test" }));
            await AssertErrorThroughInvokeAdapter(activity, "Missing kind property for search");
        }

        [Fact]
        public async Task TestGetSearchInvokeValue_MissingQueryTextThrows()
        {
            var activity = GetSearchActivity(JObject.FromObject(new SearchInvokeValue { Kind = SearchInvokeTypes.Typeahead }));
            await AssertErrorThroughInvokeAdapter(activity, "Missing queryText property for search");
        }

        private Activity GetSearchActivity(object value)
        {
            return new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "application/search",
                Value = value
            };
        }

        private async Task AssertErrorThroughInvokeAdapter(Activity activity, string errorMessage)
        {
            // Arrange
            var adapter = new TestInvokeAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default);

            // Assert
            var sent = adapter.Activity as Activity;
            Assert.Equal(ActivityTypesEx.InvokeResponse, sent.Type);

            Assert.IsType<InvokeResponse>(sent.Value);
            var value = sent.Value as InvokeResponse;
            Assert.Equal(400, value.Status);

            Assert.IsType<AdaptiveCardInvokeResponse>(value.Body);
            var body = value.Body as AdaptiveCardInvokeResponse;
            Assert.Equal("application/vnd.microsoft.error", body.Type);
            Assert.Equal(400, body.StatusCode);

            Assert.IsType<Error>(body.Value);
            var error = body.Value as Error;
            Assert.Equal("BadRequest", error.Code);
            Assert.Equal(errorMessage, error.Message);
        }
    }
}
