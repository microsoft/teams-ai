
using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Models;
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
            List<Citation> citations = new List<Citation>();
            citations.Add(new Citation(content: "test-content", title: "test", url: "https://example.com"));
            streamer.SetCitations(citations);
            streamer.QueueTextChunk("first");
            await streamer.WaitForQueue();
            streamer.QueueTextChunk("second");
            await streamer.WaitForQueue();
            streamer.EnableFeedbackLoop = true;
            streamer.EnableGeneratedByAILabel = true;
            streamer.SensitivityLabel = new SensitivityUsageInfo() { Name= "Sensitivity"};
            await streamer.EndStream();
            Assert.Equal(2, streamer.UpdatesSent());
            if (streamer.Citations != null)
            {
                Assert.Single(streamer.Citations);
            }
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
            if (streamer.Citations != null)
            {
                Assert.Empty(streamer.Citations);
            }
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

        [Fact]
        public async Task Test_SendTextChunk_SendsFinalMessageWithUniqueCitations()
        {
            // Arrange
            List<Activity> activitiesToSend = [];
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend.AddRange(arg);
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

            // Prepare two citations and set them on the streamer.
            // Citation with [1] and citation with [2]
            var citations = new List<Citation>
            {
                new Citation(content: "Citation 1 content", title: "Citation 1", url: "https://example.com/1"),
                new Citation(content: "Citation 2 content", title: "Citation 2", url: "https://example.com/2")
            };
            streamer.SetCitations(citations);

            // Queue text chunks where citation [1] is referenced multiple times and [2] is referenced once.
            streamer.QueueTextChunk("This is a test with citation [1] and again citation [1].");
            await streamer.WaitForQueue();
            streamer.QueueTextChunk("Adding citation [2] and citation [1] again.");
            await streamer.WaitForQueue();

            // End the stream which should combine text chunks and deduplicate citations.
            await streamer.EndStream();

            // Assert that two updates were sent.
            Assert.Equal(2, streamer.UpdatesSent());

            // Assert that the citations included in the final message are unique.
            // Since [1] was referenced multiple times, the final unique citation count should be 2.
            Assert.NotNull(streamer.Citations);
            Assert.Equal(2, streamer.Citations.Count);

            // Assert that the citations are unique in the activities to send collection
            activitiesToSend.ForEach(activity =>
            {
                if (activity.Entities != null)
                {
                    foreach (var entity in activity.Entities)
                    {
                        if (entity is AIEntity)
                        {
                            var citations = ((AIEntity)entity).Citation;

                            // Assert that the citations are unique by comparing the property "position"
                            var uniqueCitations = citations.GroupBy(c => c.Position).Select(g => g.First()).ToList();
                            Assert.Equal(citations.Count, uniqueCitations.Count);
                        }
                    }
                }
            }) ;

        }
    }
}
