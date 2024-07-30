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
            Verify.ParamNotNull(options.ApiKey, "OpenAIModelOptions.ApiKey");
            Verify.ParamNotNull(options.DefaultModel, "OpenAIModelOptions.DefaultModel");

            _useAzure = false;
            _options = new OpenAIModelOptions(options.ApiKey, options.DefaultModel)
            {
                Organization = options.Organization,
                CompletionType = options.CompletionType ?? CompletionType.Chat,
                LogRequests = options.LogRequests ?? false,
                RetryPolicy = options.RetryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) },
                UseSystemMessages = options.UseSystemMessages ?? false,
            };
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();

            OpenAIClientOptions openAIClientOptions = new()
            {
                RetryPolicy = new SequentialDelayRetryPolicy(_options.RetryPolicy, _options.RetryPolicy.Count)
            };

            openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), PipelinePosition.PerCall);
            if (httpClient != null)
            {
                openAIClientOptions.Transport = new HttpClientPipelineTransport(httpClient);
            }
            OpenAIModelOptions openAIModelOptions = (OpenAIModelOptions)_options;
            if (!string.IsNullOrEmpty(openAIModelOptions.Organization))
            {
                openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("OpenAI-Organization", openAIModelOptions.Organization!), PipelinePosition.PerCall);
            }
            _openAIClient = new OpenAIClient(new ApiKeyCredential(openAIModelOptions.ApiKey), openAIClientOptions);

            _deploymentName = options.DefaultModel;
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
            Verify.ParamNotNull(options.AzureApiKey, "AzureOpenAIModelOptions.AzureApiKey");
            Verify.ParamNotNull(options.AzureDefaultDeployment, "AzureOpenAIModelOptions.AzureDefaultDeployment");
            Verify.ParamNotNull(options.AzureEndpoint, "AzureOpenAIModelOptions.AzureEndpoint");
            string apiVersion = options.AzureApiVersion ?? "2024-06-01";
            ServiceVersion? serviceVersion = ConvertStringToServiceVersion(apiVersion);
            if (serviceVersion == null)
            {
                throw new ArgumentException($"Model created with an unsupported API version of `{apiVersion}`.");
            }

            _useAzure = true;
            _options = new AzureOpenAIModelOptions(options.AzureApiKey, options.AzureDefaultDeployment, options.AzureEndpoint)
            {
                AzureApiVersion = apiVersion,
                CompletionType = options.CompletionType ?? CompletionType.Chat,
                LogRequests = options.LogRequests ?? false,
                RetryPolicy = options.RetryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) },
                UseSystemMessages = options.UseSystemMessages ?? false,
            };
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();

            AzureOpenAIClientOptions azureOpenAIClientOptions = new(serviceVersion.Value)
            {
                RetryPolicy = new SequentialDelayRetryPolicy(_options.RetryPolicy, _options.RetryPolicy.Count)
            };

            azureOpenAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), PipelinePosition.PerCall);
            if (httpClient != null)
            {
                azureOpenAIClientOptions.Transport = new HttpClientPipelineTransport(httpClient);
            }
            AzureOpenAIModelOptions azureOpenAIModelOptions = (AzureOpenAIModelOptions)_options;
            _openAIClient = new AzureOpenAIClient(new Uri(azureOpenAIModelOptions.AzureEndpoint), new ApiKeyCredential(azureOpenAIModelOptions.AzureApiKey), azureOpenAIClientOptions);

            _deploymentName = options.AzureDefaultDeployment;
        }

        /// <inheritdoc/>
        public async Task<PromptResponse> CompletePromptAsync(ITurnContext turnContext, IMemory memory, IPromptFunctions<List<string>> promptFunctions, ITokenizer tokenizer, PromptTemplate promptTemplate, CancellationToken cancellationToken = default)
        {
            DateTime startTime = DateTime.UtcNow;
            int maxInputTokens = promptTemplate.Configuration.Completion.MaxInputTokens;


            if (_options.CompletionType == CompletionType.Chat)
            {
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
                    // TODO: Colorize
                    _logger.LogTrace("CHAT PROMPT:");
                    _logger.LogTrace(JsonSerializer.Serialize(prompt.Output, _serializerOptions));
                }

                // Get input message
                // - we're doing this here because the input message can be complex and include images.
                ChatMessage? input = null;
                int last = prompt.Output.Count - 1;
                if (last >= 0 && prompt.Output[last].Role == "user")
                {
                    input = prompt.Output[last];
                }

                // Call chat completion API
                IEnumerable<OAIChat.ChatMessage> chatMessages = prompt.Output.Select(chatMessage => chatMessage.ToOpenAIChatMessage());

                ChatCompletionOptions? chatCompletionOptions = ModelReaderWriter.Read<ChatCompletionOptions>(BinaryData.FromString($@"{{
                    ""max_tokens"": {promptTemplate.Configuration.Completion.MaxTokens},
                    ""temperature"": {(float)promptTemplate.Configuration.Completion.Temperature},
                    ""top_p"": {(float)promptTemplate.Configuration.Completion.TopP},
                    ""presence_penalty"": {(float)promptTemplate.Configuration.Completion.PresencePenalty},
                    ""frequency_penalty"": {(float)promptTemplate.Configuration.Completion.FrequencyPenalty}
                }}"));

                if (chatCompletionOptions == null)
                {
                    throw new TeamsAIException("Failed to create chat completions options");
                }

                // TODO: Use this once setters are added for the following fields in `OpenAI` package.
                //OAIChat.ChatCompletionOptions chatCompletionsOptions = new()
                //{
                //    MaxTokens = maxInputTokens,
                //    Temperature = (float)promptTemplate.Configuration.Completion.Temperature,
                //    TopP = (float)promptTemplate.Configuration.Completion.TopP,
                //    PresencePenalty = (float)promptTemplate.Configuration.Completion.PresencePenalty,
                //    FrequencyPenalty = (float)promptTemplate.Configuration.Completion.FrequencyPenalty,
                //};

                IDictionary<string, JsonElement>? additionalData = promptTemplate.Configuration.Completion.AdditionalData;
                if (_useAzure)
                {
                    AddAzureChatExtensionConfigurations(chatCompletionOptions, additionalData);
                }

                PipelineResponse? rawResponse;
                ClientResult<ChatCompletion>? chatCompletionsResponse = null;
                PromptResponse promptResponse = new();
                try
                {
                    chatCompletionsResponse = await _openAIClient.GetChatClient(_deploymentName).CompleteChatAsync(chatMessages, chatCompletionOptions, cancellationToken);
                    rawResponse = chatCompletionsResponse.GetRawResponse();
                    promptResponse.Status = PromptResponseStatus.Success;
                    promptResponse.Message = new ChatMessage(chatCompletionsResponse.Value);
                    promptResponse.Input = input;
                }
                catch (ClientResultException e)
                {
                    // TODO: Verify if RequestFailedException is thrown when request fails.
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
                return promptResponse;
            }
            else
            {
                throw new TeamsAIException("The legacy completion endpoint has been deprecated, please use the chat completions endpoint instead");
            }
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

        private void AddAzureChatExtensionConfigurations(OAIChat.ChatCompletionOptions options, IDictionary<string, JsonElement>? additionalData)
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
                    AzureChatDataSource? dataSource = ModelReaderWriter.Read<AzureChatDataSource>(BinaryData.FromObjectAsJson(item));
                    if (dataSource != null)
                    {
#pragma warning disable AOAI001
                        options.AddDataSource(dataSource);
#pragma warning restore AOAI001
                    }
                }
            }
        }
    }
}
