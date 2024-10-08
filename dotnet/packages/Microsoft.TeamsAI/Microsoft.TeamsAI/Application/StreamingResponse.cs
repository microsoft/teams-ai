using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI.Application
{

    /// <summary>
    /// A helper class for streaming responses to the client.
    /// This class is used to send a series of updates to the client in a single response. The expected
    /// sequence of calls is:
    /// 
    /// `QueueInformativeUpdate()`, `QueueTextChunk()`, `QueueTextChunk()`, ..., `EndStream()`.
    ///
    ///  Once `EndStream()` is called, the stream is considered ended and no further updates can be sent.
    /// </summary>
    public class StreamingResponse
    {
        private readonly ITurnContext _context;
        private int _nextSequence = 1;
        private bool _ended = false;

        // Queue for outgoing activities
        private IList<Func<Activity>> _queue = [];
        private Task? _queueSync;
        private bool _chunkQueued = false;

        /// <summary>
        /// Fluent interface for accessing the attachments.
        /// </summary>
        public IList<Attachment>? Attachments { get; set; } = [];

        /// <summary>
        /// Gets the stream ID of the current response.
        /// Assigned after the initial update is sent.
        /// </summary>
        public string? StreamId { get; private set; }

        /// <summary>
        /// Fluent interface for accessing the message.
        /// </summary>
        public string Message { get; private set; } = "";

        /// <summary>
        /// Gets the number of updates sent for the stream.
        /// </summary>
        /// <returns>Number of updates sent so far.</returns>
        public int UpdatesSent() => this._nextSequence - 1;

        /// <summary>
        /// Creates a new instance of the <see cref="StreamingResponse"/> class.
        /// </summary>
        /// <param name="context">Context for the current turn of conversation with the user.</param>
        public StreamingResponse(ITurnContext context)
        {
            this._context = context;
        }

        /// <summary>
        /// Waits for the outgoing activity queue to be empty.
        /// </summary>
        /// <returns></returns>
        public Task WaitForQueue()
        {
            return this._queueSync != null ? this._queueSync : Task.CompletedTask;
        }

        /// <summary>
        /// Queues an informative update to be sent to the client.
        /// </summary>
        /// <param name="text">Text of the update to send.</param>
        /// <exception cref="TeamsAIException">Throws if the stream has already ended.</exception>
        public void QueueInformativeUpdate(string text)
        {
            if (this._ended)
            {
                throw new TeamsAIException("The stream has already ended.");
            }

            QueueActivity(() => new Activity
            {
                Type = ActivityTypes.Typing,
                Text = text,
                ChannelData = new StreamingChannelData
                {
                    StreamType = StreamType.Informative,
                    StreamSequence = this._nextSequence++,
                }
            });
        }

        /// <summary>
        /// Queues a chunk of partial message text to be sent to the client.
        /// </summary>
        /// <param name="text">Partial text of the message to send.</param>
        /// <exception cref="TeamsAIException">Throws if the stream has already ended.</exception>
        public void QueueTextChunk(string text)
        {
            if (this._ended)
            {
                throw new TeamsAIException("The stream has already ended.");
            }

            Message += text;
            QueueNextChunk();
        }

        /// <summary>
        /// Ends the stream by sending the final message to the client.
        /// </summary>
        /// <returns>A Task representing the async operation</returns>
        /// <exception cref="TeamsAIException">Throws if the stream has already ended.</exception>
        public Task EndStream()
        {
            if (this._ended)
            {
                throw new TeamsAIException("The stream has already ended.");
            }

            this._ended = true;
            QueueNextChunk();

            // Wait for the queue to drain
            return this._queueSync!;
        }

        /// <summary>
        /// Queue an activity to be sent to the client.
        /// </summary>
        /// <param name="factory"></param>
        private void QueueActivity(Func<Activity> factory)
        {
            this._queue.Add(factory);

            // If there's no sync in progress, start one
            if (this._queueSync == null)
            {
                this._queueSync = DrainQueue();
            }
        }

        /// <summary>
        /// Queue the next chunk of text to be sent to the client.
        /// </summary>
        private void QueueNextChunk()
        {
            // Check if we are already waiting to send a chunk
            if (this._chunkQueued)
            {
                return;
            }

            // Queue a chunk of text to be sent
            this._chunkQueued = true;
            QueueActivity(() =>
            {
                this._chunkQueued = false;

                if (this._ended)
                {
                    // Send final message
                    return new Activity
                    {
                        Type = ActivityTypes.Message,
                        Text = Message,
                        Attachments = Attachments != null ? Attachments : [],
                        ChannelData = new StreamingChannelData
                        {
                            StreamType = StreamType.Final,
                        }
                    };
                }
                else
                {
                    // Send typing activity
                    return new Activity
                    {
                        Type = ActivityTypes.Typing,
                        Text = Message,
                        ChannelData = new StreamingChannelData
                        {
                            StreamType = StreamType.Streaming,
                            StreamSequence = this._nextSequence++,
                        }
                    };

                }
            });
        }

        /// <summary>
        /// Sends any queued activities to the client until the queue is empty.
        /// </summary>
        private async Task DrainQueue()
        {
            await Task.Run(async () =>
            {
                try
                {
                    while (this._queue.Count > 0)
                    {
                        // Get next activity from queue
                        Activity activity = _queue[0]();
                        await SendActivity(activity).ConfigureAwait(false);
                        _queue.RemoveAt(0);
                    }
                }

                finally
                {
                    // Queue is empty, mark as idle
                    this._queueSync = null;
                }
            }).ConfigureAwait(false);
        }

        /// <summary>
        /// Sends an activity to the client and saves the stream ID returned.
        /// </summary>
        /// <param name="activity">The activity to send.</param>
        /// <returns>A Task representing the async operation.</returns>
        private async Task SendActivity(Activity activity)
        {
            // Set activity ID to the assigned stream ID
            if (!string.IsNullOrEmpty(StreamId))
            {
                StreamingChannelData oldChannelData = activity.GetChannelData<StreamingChannelData>();
                StreamingChannelData updatedChannelData = new()
                {
                    streamId = StreamId,
                    StreamType = oldChannelData.StreamType,
                };

                if (oldChannelData.StreamSequence != null)
                {
                    updatedChannelData.StreamSequence = oldChannelData.StreamSequence;
                }

                activity.ChannelData = updatedChannelData;
            }

            ResourceResponse response = await this._context.SendActivityAsync(activity).ConfigureAwait(false);

            // Save assigned stream ID
            if (string.IsNullOrEmpty(StreamId))
            {
                StreamId = response.Id;
            }
        }
    }
}
