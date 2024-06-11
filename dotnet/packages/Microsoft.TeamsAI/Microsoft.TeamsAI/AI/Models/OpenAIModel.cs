using Azure;
using Azure.AI.OpenAI;
using Azure.Core;
using Azure.Core.Pipeline;
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
using static Azure.AI.OpenAI.OpenAIClientOptions;
using static Microsoft.Teams.AI.AI.Prompts.CompletionConfiguration;

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
        private readonly static JsonSerializerOptions _serializerOptions = new()
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
                RetryPolicy = new RetryPolicy(_options.RetryPolicy!.Count, new SequentialDelayStrategy(_options.RetryPolicy))
            };
            openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), HttpPipelinePosition.PerCall);
            if (httpClient != null)
            {
                openAIClientOptions.Transport = new HttpClientTransport(httpClient);
            }
            OpenAIModelOptions openAIModelOptions = (OpenAIModelOptions)_options;
            if (!string.IsNullOrEmpty(openAIModelOptions.Organization))
            {
                openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("OpenAI-Organization", openAIModelOptions.Organization!), HttpPipelinePosition.PerCall);
            }
            _openAIClient = new OpenAIClient(openAIModelOptions.ApiKey, openAIClientOptions);

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
            string apiVersion = options.AzureApiVersion ?? "2024-02-15-preview";
            ServiceVersion? serviceVersion = ConvertStringToServiceVersion(apiVersion);
            if (serviceVersion == null)
            {
                throw new ArgumentException($"Model created with an unsupported API version of `{apiVersion}`.");
            }

            _options = new AzureOpenAIModelOptions(options.AzureApiKey, options.AzureDefaultDeployment, options.AzureEndpoint)
            {
                AzureApiVersion = apiVersion,
                CompletionType = options.CompletionType ?? CompletionType.Chat,
                LogRequests = options.LogRequests ?? false,
                RetryPolicy = options.RetryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) },
                UseSystemMessages = options.UseSystemMessages ?? false,
            };
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();

            OpenAIClientOptions openAIClientOptions = new(serviceVersion.Value)
            {
                RetryPolicy = new RetryPolicy(_options.RetryPolicy!.Count, new SequentialDelayStrategy(_options.RetryPolicy))
            };
            openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), HttpPipelinePosition.PerCall);
            if (httpClient != null)
            {
                openAIClientOptions.Transport = new HttpClientTransport(httpClient);
            }
            AzureOpenAIModelOptions azureOpenAIModelOptions = (AzureOpenAIModelOptions)_options;
            _openAIClient = new OpenAIClient(new Uri(azureOpenAIModelOptions.AzureEndpoint), new AzureKeyCredential(azureOpenAIModelOptions.AzureApiKey), openAIClientOptions);

            _deploymentName = options.AzureDefaultDeployment;
        }

        /// <inheritdoc/>
        public async Task<PromptResponse> CompletePromptAsync(ITurnContext turnContext, IMemory memory, IPromptFunctions<List<string>> promptFunctions, ITokenizer tokenizer, PromptTemplate promptTemplate, CancellationToken cancellationToken = default)
        {
            DateTime startTime = DateTime.UtcNow;
            int maxInputTokens = promptTemplate.Configuration.Completion.MaxInputTokens;


            if (_options.CompletionType == CompletionType.Text)
            {
                // Render prompt
                RenderedPromptSection<string> prompt = await promptTemplate.Prompt.RenderAsTextAsync(turnContext, memory, promptFunctions, tokenizer, maxInputTokens, cancellationToken);
                if (prompt.TooLong)
                {
                    return new PromptResponse
                    {
                        Status = PromptResponseStatus.TooLong,
                        Error = new($"The generated text completion prompt had a length of {prompt.Length} tokens which exceeded the MaxInputTokens of {maxInputTokens}.")
                    };
                }
                if (_options.LogRequests!.Value)
                {
                    // TODO: Colorize
                    _logger.LogTrace("PROMPT:");
                    _logger.LogTrace(prompt.Output);
                }

                CompletionsOptions completionsOptions = new(_deploymentName, new List<string> { prompt.Output })
                {
                    MaxTokens = maxInputTokens,
                    Temperature = (float)promptTemplate.Configuration.Completion.Temperature,
                    NucleusSamplingFactor = (float)promptTemplate.Configuration.Completion.TopP,
                    PresencePenalty = (float)promptTemplate.Configuration.Completion.PresencePenalty,
                    FrequencyPenalty = (float)promptTemplate.Configuration.Completion.FrequencyPenalty,
                };

                Response? rawResponse;
                Response<Completions>? completionsResponse = null;
                PromptResponse promptResponse = new();
                try
                {
                    completionsResponse = await _openAIClient.GetCompletionsAsync(completionsOptions, cancellationToken);
                    rawResponse = completionsResponse.GetRawResponse();
                    promptResponse.Status = PromptResponseStatus.Success;
                    promptResponse.Message = new ChatMessage(ChatRole.Assistant)
                    {
                        Content = completionsResponse.Value.Choices[0].Text
                    };
                }
                catch (RequestFailedException e)
                {
                    rawResponse = e.GetRawResponse();
                    HttpOperationException httpOperationException = e.ToHttpOperationException();
                    if (httpOperationException.StatusCode == (HttpStatusCode)429)
                    {
                        promptResponse.Status = PromptResponseStatus.RateLimited;
                        promptResponse.Error = new("The text completion API returned a rate limit error.");
                    }
                    else
                    {
                        promptResponse.Status = PromptResponseStatus.Error;
                        promptResponse.Error = new($"The text completion API returned an error status of {httpOperationException.StatusCode}: {httpOperationException.Message}");
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
                        _logger.LogTrace(JsonSerializer.Serialize(completionsResponse!.Value, _serializerOptions));
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
                IEnumerable<ChatRequestMessage> chatMessages = prompt.Output.Select(chatMessage => chatMessage.ToChatRequestMessage());
                ChatCompletionsOptions chatCompletionsOptions = new(_deploymentName, chatMessages)
                {
                    MaxTokens = maxInputTokens,
                    Temperature = (float)promptTemplate.Configuration.Completion.Temperature,
                    NucleusSamplingFactor = (float)promptTemplate.Configuration.Completion.TopP,
                    PresencePenalty = (float)promptTemplate.Configuration.Completion.PresencePenalty,
                    FrequencyPenalty = (float)promptTemplate.Configuration.Completion.FrequencyPenalty,
                };

                IDictionary<string, JsonElement>? additionalData = promptTemplate.Configuration.Completion.AdditionalData;
                AddAzureChatExtensionConfigurations(chatCompletionsOptions, additionalData);

                Response? rawResponse;
                Response<ChatCompletions>? chatCompletionsResponse = null;
                PromptResponse promptResponse = new();
                try
                {
                    chatCompletionsResponse = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions, cancellationToken);
                    rawResponse = chatCompletionsResponse.GetRawResponse();
                    promptResponse.Status = PromptResponseStatus.Success;
                    promptResponse.Message = chatCompletionsResponse.Value.Choices[0].Message.ToChatMessage();
                    promptResponse.Input = input;
                }
                catch (RequestFailedException e)
                {
                    rawResponse = e.GetRawResponse();
                    HttpOperationException httpOperationException = e.ToHttpOperationException();
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
        }

        private ServiceVersion? ConvertStringToServiceVersion(string apiVersion)
        {
            switch (apiVersion)
            {
                case "2022-12-01": return ServiceVersion.V2022_12_01;
                case "2023-05-15": return ServiceVersion.V2023_05_15;
                case "2023-06-01-preview": return ServiceVersion.V2023_06_01_Preview;
                case "2023-07-01-preview": return ServiceVersion.V2023_07_01_Preview;
                case "2024-02-15-preview": return ServiceVersion.V2024_02_15_Preview;
                case "2024-03-01-preview": return ServiceVersion.V2024_03_01_Preview;
                default:
                    return null;
            }
        }

        private void AddAzureChatExtensionConfigurations(ChatCompletionsOptions options, IDictionary<string, JsonElement>? additionalData)
        {
            if (additionalData == null)
            {
                return;
            }

            if (additionalData != null && additionalData.TryGetValue("data_sources", out JsonElement array))
            {
                List<AzureChatExtensionConfiguration> configurations = new();
                List<object> entries = array.Deserialize<List<object>>()!;
                foreach (object item in entries)
                {
                    AzureChatExtensionConfiguration? dataSourceItem = ModelReaderWriter.Read<AzureChatExtensionConfiguration>(BinaryData.FromObjectAsJson(item));
                    if (dataSourceItem != null)
                    {
                        configurations.Add(dataSourceItem);
                    }
                }

                if (configurations.Count > 0)
                {
                    options.AzureExtensionsOptions = new();
                    foreach (AzureChatExtensionConfiguration configuration in configurations)
                    {
                        options.AzureExtensionsOptions.Extensions.Add(configuration);
                    }
                }
            }
        }
    }
}
