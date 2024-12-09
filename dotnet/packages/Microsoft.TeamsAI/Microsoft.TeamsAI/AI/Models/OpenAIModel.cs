using Microsoft.Bot.Builder;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using System.ClientModel.Primitives;
using System.Net;
using System.Text.Json;
using OpenAI;
using OAIChat = OpenAI.Chat;
using Azure.AI.OpenAI;
using static Microsoft.Teams.AI.AI.Prompts.CompletionConfiguration;
using System.ClientModel;
using ServiceVersion = Azure.AI.OpenAI.AzureOpenAIClientOptions.ServiceVersion;
using Azure.AI.OpenAI.Chat;
using OpenAI.Chat;
using Microsoft.Teams.AI.Application;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.Options;

[assembly: InternalsVisibleTo("Microsoft.Teams.AI.Tests")]
#pragma warning disable AOAI001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// A `IPromptCompletionModel` for calling OpenAI and Azure OpenAI hosted models.
    /// </summary>
    /// <remarks>
    /// The model has been updated to support calling OpenAI's new o1 family of models. That currently 
    /// comes with a few constraints. These constraints are mostly handled for you but are worth noting:
    ///     
    /// * The o1 models introduce a new `max_completion_tokens` parameter and they've deprecated the
    ///   `max_tokens` parameter. The model will automatically convert the incoming `max_tokens` parameter
    ///   to `max_completion_tokens` for you. But you should be aware that o1 has hidden token usage and costs
    ///   that aren't constrained by the `max_completion_tokens` parameter. This means that you may see an
    ///   increase in token usage and costs when using the o1 models. 
    ///   
    /// * The o1 models do not currently support the sending of system messages which just means that the 
    /// `useSystemMessages` parameter is ignored when calling the o1 models.
    /// 
    /// * The o1 models do not currently support setting the `temperature`, `top_p`, and `presence_penalty` 
    ///   parameters so they will be ignored.
    /// 
    /// * The o1 models do not currently support the use of tools so you will need to use the "monologue" 
    ///   augmentation to call actions.
    /// </remarks>
    public class OpenAIModel : IPromptCompletionStreamingModel
    {
        private readonly BaseOpenAIModelOptions _options;
        private readonly ILogger _logger;

        private readonly OpenAIClient _openAIClient;
        private readonly string _deploymentName;
        private readonly bool _useAzure;
        private static readonly JsonSerializerOptions _serializerOptions = new()
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        private static readonly string _userAgent = "AlphaWave";

        /// <summary>
        /// Events emitted by the model.
        /// </summary>
        public PromptCompletionModelEmitter? Events { get; set; } = new();

        /// <summary>
        /// Initializes a new instance of the <see cref="OpenAIModel"/> class.
        /// </summary>
        /// <param name="options">Options for configuring an `OpenAIModel` to call an OpenAI hosted model.</param>
        /// <param name="loggerFactory">The logger factory instance.</param>
        /// <param name="httpClient">HTTP client.</param>
        public OpenAIModel(OpenAIModelOptions options, ILoggerFactory? loggerFactory = null, HttpClient? httpClient = null)
        {
            Verify.ParamNotNull(options);
            Verify.ParamNotNull(options.DefaultModel, "OpenAIModelOptions.DefaultModel");

            _useAzure = false;
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();

            options.CompletionType = options.CompletionType ?? CompletionType.Chat;
            options.LogRequests = options.LogRequests ?? false;
            options.RetryPolicy = options.RetryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) };
            options.UseSystemMessages = options.UseSystemMessages ?? false;

            OpenAIClientOptions openAIClientOptions = new()
            {
                RetryPolicy = new SequentialDelayRetryPolicy(options.RetryPolicy, options.RetryPolicy.Count)
            };

            openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), PipelinePosition.PerCall);
            if (httpClient != null)
            {
                openAIClientOptions.Transport = new HttpClientPipelineTransport(httpClient);
            }
            if (!string.IsNullOrEmpty(options.Organization))
            {
                openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("OpenAI-Organization", options.Organization!), PipelinePosition.PerCall);
            }
            _openAIClient = new OpenAIClient(new ApiKeyCredential(options.ApiKey), openAIClientOptions);

            _deploymentName = options.DefaultModel;
            _options = options;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="OpenAIModel"/> class.
        /// </summary>
        /// <param name="options">Options for configuring an `OpenAIModel` to call an Azure OpenAI hosted model.</param>
        /// <param name="loggerFactory">The logger factory instance.</param>
        /// <param name="httpClient">HTTP client.</param>
        public OpenAIModel(AzureOpenAIModelOptions options, ILoggerFactory? loggerFactory = null, HttpClient? httpClient = null)
        {
            Verify.ParamNotNull(options);
            Verify.ParamNotNull(options.AzureDefaultDeployment, "AzureOpenAIModelOptions.AzureDefaultDeployment");
            Verify.ParamNotNull(options.AzureEndpoint, "AzureOpenAIModelOptions.AzureEndpoint");
            string apiVersion = options.AzureApiVersion ?? "2024-06-01";
            ServiceVersion? serviceVersion = ConvertStringToServiceVersion(apiVersion);
            if (serviceVersion == null)
            {
                throw new ArgumentException($"Model created with an unsupported API version of `{apiVersion}`.");
            }

            _useAzure = true;
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();

            options.AzureApiVersion = apiVersion;
            options.CompletionType = options.CompletionType ?? CompletionType.Chat;
            options.LogRequests = options.LogRequests ?? false;
            options.RetryPolicy = options.RetryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) };
            options.UseSystemMessages = options.UseSystemMessages ?? false;

            AzureOpenAIClientOptions azureOpenAIClientOptions = new(serviceVersion.Value)
            {
                RetryPolicy = new SequentialDelayRetryPolicy(options.RetryPolicy, options.RetryPolicy.Count)
            };

            azureOpenAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), PipelinePosition.PerCall);
            if (httpClient != null)
            {
                azureOpenAIClientOptions.Transport = new HttpClientPipelineTransport(httpClient);
            }

            Uri uri = new(options.AzureEndpoint);
            if (options.TokenCredential != null)
            {
                _openAIClient = new AzureOpenAIClient(uri, options.TokenCredential, azureOpenAIClientOptions);
            }
            else if (options.AzureApiKey != null && options.AzureApiKey != string.Empty)
            {
                _openAIClient = new AzureOpenAIClient(uri, new ApiKeyCredential(options.AzureApiKey), azureOpenAIClientOptions);
            }
            else
            {
                throw new ArgumentException("token credential or api key is required.");
            }

            _deploymentName = options.AzureDefaultDeployment;
            _options = options;
        }

        /// <inheritdoc/>
        public async Task<PromptResponse> CompletePromptAsync(ITurnContext turnContext, IMemory memory, IPromptFunctions<List<string>> promptFunctions, ITokenizer tokenizer, PromptTemplate promptTemplate, CancellationToken cancellationToken = default)
        {
            if (_options.CompletionType != CompletionType.Chat)
            {
                throw new TeamsAIException("The legacy completion endpoint has been deprecated, please use the chat completions endpoint instead");
            }

            DateTime startTime = DateTime.UtcNow;
            CompletionConfiguration completion = promptTemplate.Configuration.Completion;
            int maxInputTokens = completion.MaxInputTokens;

            if (this._options.Stream == true && Events != null)
            {
                // Signal start of completion
                BeforeCompletionEventArgs beforeCompletionEventArgs = new(turnContext, memory, promptFunctions, tokenizer, promptTemplate, this._options.Stream ?? false);
                Events.OnBeforeCompletion(beforeCompletionEventArgs);
            }

            // Render prompt
            RenderedPromptSection<List<ChatMessage>> prompt = await promptTemplate.Prompt.RenderAsMessagesAsync(turnContext, memory, promptFunctions, tokenizer, maxInputTokens, cancellationToken);
            if (prompt.TooLong)
            {
                return new PromptResponse
                {
                    Status = PromptResponseStatus.TooLong,
                    Error = new($"The generated chat completion prompt had a length of {prompt.Length} tokens which exceeded the MaxInputTokens of {maxInputTokens}.")
                };
            }

            // Get the model to use.
            string model = promptTemplate.Configuration.Completion.Model ?? _deploymentName;
            bool isO1Model = model.StartsWith("o1-");
            bool useSystemMessages = !isO1Model && _options.UseSystemMessages.GetValueOrDefault(false);
            if (!useSystemMessages && prompt.Output.Count > 0 && prompt.Output[0].Role == ChatRole.System)
            {
                prompt.Output[0].Role = ChatRole.User;
            }

            if (_options.LogRequests!.Value)
            {
                _logger.LogTrace("CHAT PROMPT:");
                _logger.LogTrace(JsonSerializer.Serialize(prompt.Output, _serializerOptions));
            }

            // Map to OpenAI ChatMessage
            IEnumerable<OAIChat.ChatMessage> chatMessages = prompt.Output.Select(chatMessage => chatMessage.ToOpenAIChatMessage());

            ChatCompletionOptions chatCompletionOptions = new()
            {
                Temperature = (float)completion.Temperature,
                TopP = (float)completion.TopP,
                PresencePenalty = (float)completion.PresencePenalty,
                FrequencyPenalty = (float)completion.FrequencyPenalty,
            };

            if (isO1Model)
            {
                chatCompletionOptions.MaxOutputTokenCount = completion.MaxTokens;
                chatCompletionOptions.Temperature = 1;
                chatCompletionOptions.TopP = 1;
                chatCompletionOptions.PresencePenalty = 0;
            } else
            {
                // `MaxOutputTokenCount` is not supported for non-o1 Azure OpenAI models, hence it needs to be set for it to work.
                SetMaxTokens(completion.MaxTokens, chatCompletionOptions);
            }

            // Set tools configurations
            bool isToolsAugmentation = promptTemplate.Configuration.Augmentation.Type == Augmentations.AugmentationType.Tools;
            if (isToolsAugmentation)
            {
                chatCompletionOptions.ToolChoice = completion.GetOpenAIChatToolChoice();
                chatCompletionOptions.AllowParallelToolCalls = completion.ParallelToolCalls;

                if (promptTemplate.Actions.Count > 0)
                {
                    foreach (ChatCompletionAction action in promptTemplate.Actions)
                    {
                        chatCompletionOptions.Tools.Add(action.ToChatTool());
                    }
                }
            }

            // Add Azure chat extension configurations
            IDictionary<string, JsonElement>? additionalData = promptTemplate.Configuration.Completion.AdditionalData;
            if (_useAzure)
            {
                AddAzureChatExtensionConfigurations(chatCompletionOptions, additionalData);
            }

            if (_options.LogRequests!.Value)
            {
                _logger.LogTrace("CHAT COMPLETION CONFIG:");
                _logger.LogTrace(JsonSerializer.Serialize(chatCompletionOptions, _serializerOptions));
            }


            PipelineResponse? rawResponse = null;
            ClientResult<ChatCompletion>? chatCompletionsResponse = null;
            PromptResponse promptResponse = new();
            try
            {
                if (this._options.Stream == true)
                {
                    if (_options.LogRequests!.Value)
                    {
                        // TODO: Colorize
                        _logger.LogTrace("STREAM STARTED:");
                    }

                    // Enumerate the stream chunks
                    ChatMessage message = new(ChatRole.Assistant)
                    {
                        Content = ""
                    };
                    AsyncCollectionResult<StreamingChatCompletionUpdate> streamCompletion = _openAIClient.GetChatClient(_deploymentName).CompleteChatStreamingAsync(chatMessages, chatCompletionOptions, cancellationToken);

                    var toolCallBuilder = new StreamingChatToolCallsBuilder();
                    await foreach (StreamingChatCompletionUpdate delta in streamCompletion)
                    {
                        if (delta.Role != null)
                        {
                            string role = delta.Role.ToString();
                            message.Role = new ChatRole(role);
                        }

                        if (delta.ContentUpdate.Count > 0)
                        {
                            message.Content += delta.ContentUpdate[0].Text;
                        }

                        // Handle tool calls
                        if (isToolsAugmentation && delta.ToolCallUpdates != null && delta.ToolCallUpdates.Count > 0)
                        {
                            foreach (var toolCallUpdate in delta.ToolCallUpdates)
                            {
                                toolCallBuilder.Append(toolCallUpdate);
                            }
                        }

                        ChatMessage currDeltaMessage = new(delta)
                        {
                            ActionCalls = message.ActionCalls // Ensure ActionCalls are included
                        };
                        PromptChunk chunk = new()
                        {
                            delta = currDeltaMessage
                        };

                        ChunkReceivedEventArgs args = new(turnContext, memory, chunk);

                        // Signal chunk received
                        if (_options.LogRequests!.Value)
                        {
                            _logger.LogTrace("CHUNK", delta);
                        }

                        Events!.OnChunkReceived(args);
                    }

                    // Add any tool calls to message
                    var toolCalls = toolCallBuilder.Build();
                    if (toolCalls.Count > 0)
                    {
                        message.ActionCalls = new List<ActionCall>();
                        foreach (var toolCall in toolCalls)
                        {
                            var actionCall = new ActionCall(toolCall);
                            message.ActionCalls.Add(actionCall);
                        }
                    }

                    promptResponse.Message = message;

                    // Log stream completion
                    if (_options.LogRequests!.Value)
                    {
                        _logger.LogTrace("STREAM COMPLETED");
                    }
                }
                else {
                    chatCompletionsResponse = await _openAIClient.GetChatClient(model).CompleteChatAsync(chatMessages, chatCompletionOptions, cancellationToken);
                    rawResponse = chatCompletionsResponse.GetRawResponse();
                    promptResponse.Message = new ChatMessage(chatCompletionsResponse.Value);
                }

                promptResponse.Status = PromptResponseStatus.Success;
            }
            catch (ClientResultException e)
            {
                rawResponse = e.GetRawResponse();
                HttpOperationException httpOperationException = new(e);
                if (httpOperationException.StatusCode == (HttpStatusCode)429)
                {
                    promptResponse.Status = PromptResponseStatus.RateLimited;
                    promptResponse.Error = new("The chat completion API returned a rate limit error.");
                }
                else
                {
                    promptResponse.Status = PromptResponseStatus.Error;
                    promptResponse.Error = new($"The chat completion API returned an error status of {httpOperationException.StatusCode}: {httpOperationException.Message}");
                }
            }

            if (_options.LogRequests!.Value)
            {
                _logger.LogTrace("RESPONSE:");
                _logger.LogTrace($"duration {(DateTime.UtcNow - startTime).TotalMilliseconds} ms");
                if (promptResponse.Status == PromptResponseStatus.Success && chatCompletionsResponse != null)
                {
                    _logger.LogTrace(JsonSerializer.Serialize(chatCompletionsResponse.Value, _serializerOptions));
                }

                if (rawResponse != null)
                {
                    _logger.LogTrace($"status {rawResponse!.Status}");
                    if (promptResponse.Status == PromptResponseStatus.RateLimited)
                    {
                        _logger.LogTrace("HEADERS:");
                        _logger.LogTrace(JsonSerializer.Serialize(rawResponse.Headers, _serializerOptions));
                    }
                }
            }

            // Returns if the unsuccessful response
            if (promptResponse.Status != PromptResponseStatus.Success || (chatCompletionsResponse == null && this._options.Stream == false))
            {
                return promptResponse;
            }

            if (chatCompletionsResponse != null)
            {
                // Process response
                ChatCompletion chatCompletion = chatCompletionsResponse.Value;
                List<ActionCall> actionCalls = new();
                IReadOnlyList<ChatToolCall> toolsCalls = chatCompletion.ToolCalls;
                if (isToolsAugmentation && toolsCalls.Count > 0)
                {
                    foreach (ChatToolCall toolCall in toolsCalls)
                    {
                        actionCalls.Add(new ActionCall(toolCall));
                    }
                }
            }

            if (this._options.Stream == true)
            {
                StreamingResponse? streamer = (StreamingResponse?)memory.GetValue("temp.streamer");

                if (streamer == null)
                {
                    throw new TeamsAIException("The streaming object is empty");
                }

                ResponseReceivedEventArgs responseReceivedEventArgs = new(turnContext, memory, promptResponse, streamer);
                Events!.OnResponseReceived(responseReceivedEventArgs);

                // Let any pending events flush before returning
                await Task.Delay(TimeSpan.FromSeconds(0));
            }


            List<ChatMessage>? inputs = new();
            int lastMessage = prompt.Output.Count - 1;

            // Skips the first message which is the prompt
            if (lastMessage > 0 && prompt.Output[lastMessage].Role != ChatRole.Assistant)
            {
                inputs.Add(prompt.Output.ElementAt(lastMessage));

                // Add remaining parallel tools calls
                if (inputs[0].Role == ChatRole.Tool)
                {
                    int i;
                    for (i = prompt.Output.Count - 1; i >= 0; i--)
                    {
                        if (prompt.Output[i].ActionCalls != null && prompt.Output[i].ActionCalls!.Count > 0)
                        {
                            break;
                        }
                    }
                    int firstMessage = i + 1;
                    inputs = prompt.Output.GetRange(firstMessage, prompt.Output.Count - firstMessage);
                }
            }
            promptResponse.Input = inputs;

            return promptResponse;

        }

        private ServiceVersion? ConvertStringToServiceVersion(string apiVersion)
        {
            return apiVersion switch
            {
                "2024-06-01" => ServiceVersion.V2024_06_01,
                "2024-08-01-preview" => ServiceVersion.V2024_08_01_Preview,
                "2024-10-01-preview" => ServiceVersion.V2024_10_01_Preview,
                _ => null,
            };
        }

        private void AddAzureChatExtensionConfigurations(ChatCompletionOptions options, IDictionary<string, JsonElement>? additionalData)
        {
            if (additionalData == null)
            {
                return;
            }

            if (additionalData != null && additionalData.TryGetValue("data_sources", out JsonElement array))
            {
                List<object> entries = array.Deserialize<List<object>>()!;
                foreach (object item in entries)
                {
                    try
                    {
                        ChatDataSource? dataSource = ModelReaderWriter.Read<ChatDataSource>(BinaryData.FromObjectAsJson(item));
                        if (dataSource != null)
                        {
                            options.AddDataSource(dataSource);
                        }
                    }
                    catch (Exception ex)
                    {
                        throw new ArgumentException($"Invalid azure data source configuration {ex.Message}", ex);
                    }
                }
            }
        }

        internal void SetMaxTokens(int maxTokens, ChatCompletionOptions options)
        {
            MethodInfo setMaxTokens = options.GetType().GetMethod("set__deprecatedMaxTokens", BindingFlags.NonPublic | BindingFlags.Instance);
            setMaxTokens.Invoke(options, new object[] { maxTokens });
        }
    }
}
#pragma warning restore AOAI001 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
