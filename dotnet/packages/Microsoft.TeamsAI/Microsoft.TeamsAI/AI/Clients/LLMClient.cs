using Google.Protobuf.WellKnownTypes;
using Microsoft.Bot.Builder;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Validators;
using Microsoft.Teams.AI.Application;
using Microsoft.Teams.AI.State;
using static Microsoft.Teams.AI.AI.Models.IPromptCompletionModelEvents;

namespace Microsoft.Teams.AI.AI.Clients
{
    /// <summary>
    /// LLMClient class that's used to complete prompts.
    /// </summary>
    /// <remarks>
    /// Each LLMClient, at a minimum needs to be configured with a <see cref="LLMClientOptions{TContent}.Model"/> and <see cref="LLMClientOptions{TContent}.Template"/>.
    ///
    /// Configuring the LLMClient to use a <see cref="LLMClientOptions{TContent}.Validator"/> is optional but recommended. The primary benefit to
    /// using LLMClient is it's response validation and automatic response repair features. The
    /// validator acts as guard and guarantees that you never get an malformed response back from the
    /// model. At least not without it being flagged as an `invalid_response`.
    ///
    /// Using the <see cref="JsonResponseValidator"/>, for example, guarantees that you only ever get a valid
    /// object back from <see cref="CompletePromptAsync(ITurnContext, IMemory, IPromptFunctions{List{string}}, CancellationToken)"/>. In fact, you'll get back a fully parsed object and any
    /// additional response text from the model will be dropped. If you give the <see cref="JsonResponseValidator"/>
    /// a JSON Schema, you will get back a strongly typed and validated instance of an object in
    /// the returned `response.message.content`.
    ///
    /// When a validator detects a bad response from the model, it gives the model "feedback" as to the
    /// problem it detected with its response and more importantly an instruction that tells the model
    /// how it should repair the problem. This puts the LLMClient into a special repair mode where it first
    /// forks the memory for the conversation and then has a side conversation with the model in an
    /// effort to get it to repair its response. By forking the conversation, this isolates the bad
    /// response and prevents it from contaminating the main conversation history. If the response can
    /// be repaired, the LLMClient will un-fork the memory and use the repaired response in place of the
    /// original bad response. To the model it's as if it never made a mistake which is important for
    /// future turns with the model. If the response can't be repaired, a response status of
    /// `invalid_response` will be returned.
    ///
    /// When using a well designed validator, like the <see cref="JsonResponseValidator"/>, the LLMClient can typically
    /// repair a bad response in a single additional model call. Sometimes it takes a couple of calls
    /// to effect a repair and occasionally it won't be able to repair it at all. If your prompt is
    /// well designed and you only occasionally see failed repair attempts, I'd recommend just calling
    /// the LLMClient a second time. Given the stochastic nature of these models, there's a decent chance
    /// it won't make the same mistake on the second call. A well designed prompt coupled with a well
    /// designed validator should get the reliability of calling these models somewhere close to 99%
    /// reliable.
    ///
    /// This "feedback" technique works with all the GPT-3 generation of models and I've tested it with
    /// `text-davinci-003`, `gpt-3.5-turbo`, and `gpt-4`. There's a good chance it will work with other
    /// open source models like `LLaMA` and Googles `Bard` but I have yet to test it with those models.
    /// </remarks>
    /// <typeparam name="TContent">
    /// Type of message content returned for a 'success' response. The `response.message.content` field will be of type TContent.
    /// </typeparam>
    public class LLMClient<TContent>
    {
        /// <summary>
        /// Options for this LLMClient instance.
        /// </summary>
        public readonly LLMClientOptions<TContent> Options;

        private readonly ILogger _logger;

        private readonly string? _startStreamingMessage;
        private ResponseReceivedHandler? _endStreamHandler;
        private bool? _enableFeedbackLoop;

        /// <summary>
        /// Creates a new `LLMClient` instance.
        /// </summary>
        /// <param name="options">Options for this LLMClient instance.</param>
        /// <param name="loggerFactory">logger</param>
        public LLMClient(LLMClientOptions<TContent> options, ILoggerFactory? loggerFactory = null)
        {
            this.Options = options;
            this._logger = loggerFactory?.CreateLogger(typeof(LLMClient<TContent>)) ?? NullLogger.Instance;

            if (options.LogRepairs && loggerFactory == null)
            {
                throw new ArgumentException($"`{nameof(loggerFactory)}` parameter cannot be null if `LogRepairs` option is set to true");
            }

            this._startStreamingMessage = Options.StartStreamingMessage;
            this._endStreamHandler = Options.EndStreamHandler;
            this._enableFeedbackLoop = Options.EnableFeedbackLoop;
        }

        /// <summary>
        /// Adds a result from a `function_call` to the history.
        /// </summary>
        /// <param name="memory">An interface for accessing state values.</param>
        /// <param name="name">Name of the function that was called.</param>
        /// <param name="results">Results returned by the function.</param>
        public void AddFunctionResultToHistory(IMemory memory, string name, object results)
        {
            List<ChatMessage> history = (List<ChatMessage>?)memory.GetValue(this.Options.HistoryVariable) ?? new() { };

            history.Add(new(ChatRole.Function)
            {
                Name = name,
                Content = results.ToString()
            });

            if (history.Count > this.Options.MaxHistoryMessages)
            {
                history.RemoveAt(0);
            }

            memory.SetValue(this.Options.HistoryVariable, history);
        }

        /// <summary>
        /// Completes a prompt.
        /// </summary>
        /// <remarks>
        /// The `input` parameter is optional but if passed in, will be assigned to memory using the
        /// configured `InputVariable`. If it's not passed in an attempt will be made to read it
        /// from memory so passing it in or assigning to memory works. In either case, the `input`
        /// variable is only used when constructing a user message that, will be added to the
        /// conversation history and formatted like `{ role: 'user', content: input }`.
        ///
        /// It's important to note that if you want the users input sent to the model as part of the
        /// prompt, you will need to add a `UserMessageSection` to your prompt. The LLMClient does not do
        /// anything to modify your prompt, except when performing repairs and those changes are
        /// temporary.
        ///
        /// When the model successfully returns a valid (or repaired) response, a 'user' message (if
        /// input was detected) and 'assistant' message will be automatically added to the conversation
        /// history. You can disable that behavior by setting `MaxHistoryMessages` to `0`.
        ///
        /// The response returned by `CompletePromptAsync()` will be strongly typed by the validator you're
        /// using. The `DefaultResponseValidator` returns a `string` and the `JsonResponseValidator`
        /// will return either an `object` or if a JSON Schema is provided, an instance of `TContent`.
        /// When using a custom validator, the validator is return any type of content it likes.
        ///
        /// A successful response is indicated by `response.status == 'success'` and the content can be
        /// accessed via `response.message.content`.  If a response is invalid it will have a
        /// `response.status == 'invalid_response'` and the `response.message` will be a string containing
        /// the validator feedback message.  There are other status codes for various errors and in all
        /// cases except `success` the `response.message` will be of type `string`.
        /// </remarks>
        /// <param name="context">Current turn context.</param>
        /// <param name="memory">An interface for accessing state values.</param>
        /// <param name="functions">Functions to use when rendering the prompt.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>A `PromptResponse` with the status and message.</returns>
        public async Task<PromptResponse> CompletePromptAsync(
            ITurnContext context,
            IMemory memory,
            IPromptFunctions<List<string>> functions,
            CancellationToken cancellationToken = default
        )
        {
            // Define event handlers
            StreamingResponse? streamer = null;

            BeforeCompletionHandler handleBeforeCompletion = new((object sender, BeforeCompletionEventArgs args) =>
            {
                // Ignore events for other contexts
                if (args.TurnContext != context)
                {
                    return;
                }

                if (args.Streaming)
                {
                    // Attach to any existing streamer
                    // - see tool call note below to understand.
                    streamer = (StreamingResponse?)memory.GetValue("temp.streamer");
                    if (streamer == null)
                    {
                        // Create streamer and send initial message
                        streamer = new StreamingResponse(context);
                        memory.SetValue("temp.streamer", streamer);

                        if (this._enableFeedbackLoop != null)
                        {
                            streamer.EnableFeedbackLoop = this._enableFeedbackLoop;
                        }

                        streamer.EnableGeneratedByAILabel = true;

                        if (!string.IsNullOrEmpty(this._startStreamingMessage))
                        {
                            streamer.QueueInformativeUpdate(this._startStreamingMessage!);
                        }
                    }
                }
            });

            ChunkReceivedHandler handleChunkReceived = new((object sender, ChunkReceivedEventArgs args) =>
            {
                if (args.TurnContext != context || streamer == null)
                {
                    return;
                }


                // Ignore content without text
                // - The chunk is likely for a Tool Call.
                // - See the tool call note below to understand why we're ignoring them.
                if (args.Chunk.delta?.GetContent<string>() == null)
                {
                    return;
                }

                // Send chunk to client
                string text = args.Chunk.delta?.GetContent<string>() ?? "";
                IList<Citation>? citations = args.Chunk.delta?.Context?.Citations ?? null;


                if (text.Length > 0)
                {
                    streamer.QueueTextChunk(text, citations);
                }
            });

            // Subscribe to model events
            if (this.Options.Model is IPromptCompletionStreamingModel)
            {
                IPromptCompletionStreamingModel model = (IPromptCompletionStreamingModel)Options.Model;

                if (model.Events != null)
                {
                    model.Events.BeforeCompletion += handleBeforeCompletion;
                    model.Events.ChunkReceived += handleChunkReceived;

                    if (this._endStreamHandler != null)
                    {
                        model.Events.ResponseReceived += this._endStreamHandler;
                    }
                }
            }

            try
            {
                PromptResponse response = await this.Options.Model.CompletePromptAsync(
                    context,
                    memory,
                    functions,
                    this.Options.Tokenizer,
                    this.Options.Template,
                    cancellationToken
                );

                // Handle streaming responses
                if (streamer != null)
                {
                    // Tool call handling
                    // - We need to keep the streamer around during tool calls so we're just letting them return as normal
                    //   messages minus the message content. The text content is being streamed to the client in chunks.
                    // - When the tool call completes we'll call back into ActionPlanner and end up re-attaching to the
                    //   streamer. This will result in us continuing to stream the response to the client. 
                    if (response.Message?.ActionCalls != null && response.Message.ActionCalls.Count > 0)
                    {
                        // Ensure content is empty for tool calls
                        response.Message.Content = "";
                    }
                    else
                    {
                        if (response.Status == PromptResponseStatus.Success)
                        {
                            // Delete message from response to avoid sending it twice
                            response.Message = null;
                        }

                        // End the stream and remove pointer from memory
                        // - We're not listening for the response received event because we can't await the completion of events.
                        await streamer.EndStream();
                        memory.DeleteValue("temp.streamer");
                    }
                }

                // Get input message/s
                string inputVariable = Options.InputVariable;
                IList<ChatMessage>? inputMsgs = response.Input;
                if (inputMsgs == null)
                {
                    object? content = memory.GetValue(inputVariable);
                    inputMsgs = new List<ChatMessage>() { new ChatMessage(ChatRole.User) };
                    inputMsgs[0].Content = content;
                }

                Validation validation = await this.Options.Validator.ValidateResponseAsync(
                    context,
                    memory,
                    this.Options.Tokenizer,
                    response,
                    this.Options.MaxRepairAttempts,
                    cancellationToken
                );

                if (validation.Valid)
                {
                    if (validation.Value != null && response.Message != null)
                    {
                        response.Message.Content = validation.Value.ToString();
                    }

                    this.AddMessagesToHistory(memory, this.Options.HistoryVariable, inputMsgs);

                    if (response.Message != null)
                    {
                        this.AddMessageToHistory(memory, this.Options.HistoryVariable, response.Message);
                    }

                    return response;
                }

                if (this.Options.MaxRepairAttempts <= 0)
                {
                    return response;
                }

                MemoryFork fork = new(memory);

                if (this.Options.LogRepairs)
                {
                    this._logger.LogInformation("REPAIRING RESPONSE:");
                    this._logger.LogInformation(response.Message?.Content?.ToString() ?? string.Empty);
                }

                PromptResponse repairResponse = await this.RepairResponseAsync(
                    context,
                    fork,
                    functions,
                    response,
                    validation,
                    this.Options.MaxRepairAttempts,
                    cancellationToken
                );

                if (this.Options.LogRepairs)
                {
                    this._logger.LogInformation(repairResponse.Status == PromptResponseStatus.Success ? "Response Repaired" : "Response Repair Failed");
                }

                if (repairResponse.Status == PromptResponseStatus.Success)
                {
                    this.AddMessagesToHistory(memory, this.Options.HistoryVariable, inputMsgs);

                    if (repairResponse.Message != null)
                    {
                        this.AddMessageToHistory(memory, this.Options.HistoryVariable, repairResponse.Message);
                    }
                }

                return repairResponse;
            }
            catch (Exception ex)
            {
                return new()
                {
                    Status = PromptResponseStatus.Error,
                    Error = new(ex.Message ?? string.Empty)
                };
            }
            finally
            {

                // Unsubscribe to model events
                if (this.Options.Model is IPromptCompletionStreamingModel)
                {
                    IPromptCompletionStreamingModel model = (IPromptCompletionStreamingModel)Options.Model;

                    if (model.Events != null)
                    {
                        model.Events.BeforeCompletion -= handleBeforeCompletion;
                        model.Events.ChunkReceived -= handleChunkReceived;
                        if (this._endStreamHandler != null)
                        {
                            model.Events.ResponseReceived -= this._endStreamHandler;
                        }
                    }
                }
            }
        }

        private async Task<PromptResponse> RepairResponseAsync(
            ITurnContext context,
            MemoryFork fork,
            IPromptFunctions<List<string>> functions,
            PromptResponse response,
            Validation validation,
            int remainingAttempts,
            CancellationToken cancellationToken
        )
        {
            string feedback = validation.Feedback ?? "The response was invalid. Try another strategy.";

            this.AddMessageToHistory(fork, $"{this.Options.HistoryVariable}-repair", new(ChatRole.User) { Content = feedback });

            if (response.Message != null)
            {
                this.AddMessageToHistory(fork, $"{this.Options.HistoryVariable}-repair", response.Message);
            }

            PromptTemplate repairTemplate = new(this.Options.Template);
            repairTemplate.Prompt = new(new()
            {
                this.Options.Template.Prompt,
                new ConversationHistorySection($"{this.Options.HistoryVariable}-repair", -1)
            });

            if (this.Options.LogRepairs)
            {
                this._logger.LogInformation(feedback);
            }

            PromptResponse repairResponse = await this.Options.Model.CompletePromptAsync(
                context,
                fork,
                functions,
                this.Options.Tokenizer,
                repairTemplate,
                cancellationToken
            );

            if (repairResponse.Status != PromptResponseStatus.Success)
            {
                return repairResponse;
            }

            Validation repairValidation = await this.Options.Validator.ValidateResponseAsync(
                context,
                fork,
                this.Options.Tokenizer,
                repairResponse,
                remainingAttempts,
                cancellationToken
            );

            if (repairValidation.Valid)
            {
                if (repairValidation.Value != null && repairResponse.Message != null)
                {
                    repairResponse.Message.Content = repairValidation.Value.ToString();
                }

                return repairResponse;
            }

            remainingAttempts--;

            if (remainingAttempts <= 0)
            {
                return new()
                {
                    Status = PromptResponseStatus.InvalidResponse,
                    Error = new($"Reached max model response repair attempts. Last feedback given to model: \"{feedback}\"")
                };
            }

            return await this.RepairResponseAsync(context, fork, functions, repairResponse, repairValidation, remainingAttempts, cancellationToken);
        }

        private void AddMessagesToHistory(IMemory memory, string variable, IEnumerable<ChatMessage> messages)
        {
            if (variable == string.Empty || variable == null)
            {
                return;
            }

            List<ChatMessage> history = (List<ChatMessage>?)memory.GetValue(variable) ?? new();

            history.AddRange(messages);

            if (history.Count > this.Options.MaxHistoryMessages)
            {
                int overflow = history.Count - this.Options.MaxHistoryMessages;
                history.RemoveRange(0, overflow);
            }

            // Remove completed partial action outputs
            while (history.Count > 0 && history[0].Role == ChatRole.Tool)
            {
                history.RemoveAt(0);
            }


            memory.SetValue(variable, history);
        }


        private void AddMessageToHistory(IMemory memory, string variable, ChatMessage message)
        {
            AddMessagesToHistory(memory, variable, new List<ChatMessage>() { message });
        }
    }
}
