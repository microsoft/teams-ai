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
using Microsoft.Recognizers.Text.NumberWithUnit.Dutch;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// A `PromptCompletionModel` for calling OpenAI and Azure OpenAI hosted models.
    /// </summary>
    public class OpenAIModel : IPromptCompletionModel
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

            // Setup tools if enabled
            bool isToolsAugmentation = promptTemplate.Configuration.Augmentation.Type == Augmentations.AugmentationType.Tools;
            List<ChatTool> tools = new();

            // If tools is enabled, reformat actions to schema
            if (isToolsAugmentation && promptTemplate.Actions.Count > 0)
            {
                foreach (ChatCompletionAction action in promptTemplate.Actions)
                {
                    tools.Add(action.ToChatTool());
                }
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

            if (!_options.UseSystemMessages!.Value && prompt.Output.Count > 0 && prompt.Output[0].Role == ChatRole.System)
            {
                prompt.Output[0].Role = ChatRole.User;
            }
            
            if (_options.LogRequests!.Value)
            {
                _logger.LogTrace("CHAT PROMPT:");
                _logger.LogTrace(JsonSerializer.Serialize(prompt.Output, _serializerOptions));
            }

            // TODO: REMOVE
            //// Get input message
            //// - we're doing this here because the input message can be complex and include images.
            //ChatMessage? input = null;
            //int last = prompt.Output.Count - 1;
            //if (last >= 0 && prompt.Output[last].Role == "user")
            //{
            //    input = prompt.Output[last];
            //}

            // Render prompt template
            IEnumerable<OAIChat.ChatMessage> chatMessages = prompt.Output.Select(chatMessage => chatMessage.ToOpenAIChatMessage());

            ChatCompletionOptions chatCompletionOptions = new()
            {
                MaxTokens = completion.MaxTokens,
                Temperature = (float)completion.Temperature,
                TopP = (float)completion.TopP,
                PresencePenalty = (float)completion.PresencePenalty,
                FrequencyPenalty = (float)completion.FrequencyPenalty,
            };

            if (isToolsAugmentation)
            {
                chatCompletionOptions.ToolChoice = completion.GetOpenAIChatToolChoice();
                chatCompletionOptions.ParallelToolCallsEnabled = completion.ParallelToolCalls;
            }

            foreach (ChatTool tool in tools)
            {
                chatCompletionOptions.Tools.Add(tool);
            }


            if (chatCompletionOptions == null)
            {
                throw new TeamsAIException("Failed to create chat completions options");
            }

            IDictionary<string, JsonElement>? additionalData = promptTemplate.Configuration.Completion.AdditionalData;
            if (_useAzure)
            {
                AddAzureChatExtensionConfigurations(chatCompletionOptions, additionalData);
            }

            string model = promptTemplate.Configuration.Completion.Model ?? _deploymentName;

            PipelineResponse? rawResponse;
            ClientResult<ChatCompletion>? chatCompletionsResponse = null;
            PromptResponse promptResponse = new();
            try
            {
                chatCompletionsResponse = await _openAIClient.GetChatClient(model).CompleteChatAsync(chatMessages, chatCompletionOptions, cancellationToken);
                rawResponse = chatCompletionsResponse.GetRawResponse();
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
                // TODO: Colorize
                _logger.LogTrace("RESPONSE:");
                _logger.LogTrace($"status {rawResponse!.Status}");
                _logger.LogTrace($"duration {(DateTime.UtcNow - startTime).TotalMilliseconds} ms");
                if (promptResponse.Status == PromptResponseStatus.Success)
                {
                    _logger.LogTrace(JsonSerializer.Serialize(chatCompletionsResponse!.Value, _serializerOptions));
                }
                if (promptResponse.Status == PromptResponseStatus.RateLimited)
                {
                    _logger.LogTrace("HEADERS:");
                    _logger.LogTrace(JsonSerializer.Serialize(rawResponse.Headers, _serializerOptions));
                }
            }

            // Returns if the unsuccessful response
            if (promptResponse.Status != PromptResponseStatus.Success || chatCompletionsResponse == null)
            {
                return promptResponse;
            }

            // Process response
            ChatCompletion chatCompletion = chatCompletionsResponse.Value;
            List<ActionCall> actionCalls = new();
            IReadOnlyList<ChatToolCall> toolsCalls = chatCompletion.ToolCalls;
            if (isToolsAugmentation && toolsCalls.Count > 0)
            {
                foreach(ChatToolCall toolCall in toolsCalls)
                {
                    actionCalls.Add(new ActionCall(toolCall));
                }
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
                    int firstMessage = i+1;
                    inputs = prompt.Output.GetRange(firstMessage, prompt.Output.Count - firstMessage);
                }
            }

            promptResponse.Input = inputs;
            promptResponse.Message = new ChatMessage(chatCompletionsResponse.Value);

            return promptResponse;

        }

        private ServiceVersion? ConvertStringToServiceVersion(string apiVersion)
        {
            return apiVersion switch
            {
                "2024-04-01-preview" => ServiceVersion.V2024_04_01_Preview,
                "2024-05-01-preview" => ServiceVersion.V2024_05_01_Preview,
                "2024-06-01" => ServiceVersion.V2024_06_01,
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
                        AzureChatDataSource? dataSource = ModelReaderWriter.Read<AzureChatDataSource>(BinaryData.FromObjectAsJson(item));
                        if (dataSource != null)
                        {
#pragma warning disable AOAI001
                            options.AddDataSource(dataSource);
#pragma warning restore AOAI001
                        }
                    }
                    catch (Exception ex)
                    {
                        throw new ArgumentException($"Invalid azure data source configuration {ex.Message}", ex);
                    }
                }
            }
        }
    }
}
