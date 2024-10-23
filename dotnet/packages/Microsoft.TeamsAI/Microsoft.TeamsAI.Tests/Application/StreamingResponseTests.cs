
using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Application;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.VisualStudio.TestPlatform.CommunicationUtilities;
using Moq;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class StreamingResponseTests
    {
        [Fact]
        public async Task Test_Informative_Update_SingleUpdate()
        {

            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            streamer.QueueInformativeUpdate("starting");
            await streamer.WaitForQueue();

            Assert.Equal(1, streamer.UpdatesSent());
        }

        [Fact]
        public async Task Test_Informative_Update_DoubleUpdate()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            streamer.QueueInformativeUpdate("first");
            streamer.QueueInformativeUpdate("second");
            await streamer.WaitForQueue();

            Assert.Equal(2, streamer.UpdatesSent());
        }

        [Fact]
        public async Task Test_Informative_Update_AssertThrows()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            await streamer.EndStream();

            // Act
            var func = () => streamer.QueueInformativeUpdate("first");

            // Assert
            Exception ex = Assert.Throws<TeamsAIException>(() => func());

            Assert.Equal("The stream has already ended.", ex.Message);
        }

        [Fact]
        public async Task Test_SendTextChunk()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            streamer.QueueTextChunk("first");
            await streamer.WaitForQueue();
            streamer.QueueTextChunk("second");
            await streamer.WaitForQueue();
            Assert.Equal(2, streamer.UpdatesSent());
        }

        [Fact]
        public async Task Test_SendTextChunk_AssertThrows()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            streamer.QueueTextChunk("first");
            await streamer.WaitForQueue();
            streamer.QueueTextChunk("second");
            await streamer.WaitForQueue();
            await streamer.EndStream();

            // Act
            var func = () => streamer.QueueTextChunk("third");

            // Assert
            Exception ex = Assert.Throws<TeamsAIException>(() => func());

            Assert.Equal("The stream has already ended.", ex.Message);
            Assert.Equal(2, streamer.UpdatesSent());
        }

        [Fact]
        public async Task Test_SendTextChunk_EndStreamImmediately()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            await streamer.EndStream();
            Assert.Equal(0, streamer.UpdatesSent());
        }

        [Fact]
        public async Task Test_SendTextChunk_SendsFinalMessage()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            streamer.QueueTextChunk("first");
            await streamer.WaitForQueue();
            streamer.QueueTextChunk("second");
            await streamer.WaitForQueue();
            await streamer.EndStream();
            Assert.Equal(2, streamer.UpdatesSent());
        }

        [Fact]
        public async Task Test_SendTextChunk_SendsFinalMessageWithPoweredByAIFeatures()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            streamer.QueueTextChunk("first");
            await streamer.WaitForQueue();
            streamer.QueueTextChunk("second");
            await streamer.WaitForQueue();
            streamer.EnableFeedbackLoop = true;
            streamer.EnableGeneratedByAILabel = true;
            await streamer.EndStream();
            Assert.Equal(2, streamer.UpdatesSent());
        }

        [Fact]
        public async Task Test_SendTextChunk_SendsFinalMessageWithAttachments()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            ITurnContext turnContext = new TurnContext(adapter, new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            StreamingResponse streamer = new(turnContext);
            streamer.QueueTextChunk("first");
            await streamer.WaitForQueue();
            streamer.QueueTextChunk("second");

            AdaptiveCard adaptiveCard = new();

            var adaptiveCardAttachment = new Attachment()
            {
                ContentType = "application/vnd.microsoft.card.adaptive",
                Content = adaptiveCard,
            };


            streamer.Attachments = new List<Attachment>();
            streamer.Attachments.Add(adaptiveCardAttachment);
            await streamer.WaitForQueue();
            await streamer.EndStream();
            Assert.Equal(2, streamer.UpdatesSent());
            Assert.Single(streamer.Attachments);
        }

        [Fact]
        public async Task Test_SendActivityThrowsException_AssertThrows()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContextMock = new Mock<ITurnContext>();
            turnContextMock.Setup((tc) => tc.SendActivityAsync(It.IsAny<Activity>(), It.IsAny<CancellationToken>())).ThrowsAsync(new Exception("Forbidden operation"));
            
            // Act
            StreamingResponse streamer = new(turnContextMock.Object);
            Exception ex = await Assert.ThrowsAsync<TeamsAIException>(() => streamer.EndStream());


            // Assert
            Assert.Equal("Error occurred when sending activity while streaming", ex.Message);
        }
    }
}
