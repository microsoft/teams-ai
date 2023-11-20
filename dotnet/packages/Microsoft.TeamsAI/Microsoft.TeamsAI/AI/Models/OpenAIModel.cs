using Azure;
using Azure.AI.OpenAI;
using Azure.Core;
using Azure.Core.Pipeline;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Memory;
using System.Net;
using System.Text.Json;
using static Microsoft.Teams.AI.AI.Prompts.PromptTemplate.PromptTemplateConfiguration.CompletionConfiguration;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// A `PromptCompletionModel` for calling OpenAI and Azure OpenAI hosted models.
    /// </summary>
    public class OpenAIModel : IPromptCompletionModel
    {
        private readonly BaseOpenAIModelOptions _options;
        private readonly ILogger _logger;
        private readonly HttpClient? _httpClient;

        private bool _useAzure;
        private readonly OpenAIClient _openAIClient;
        private string _deploymentName;

        private static readonly string _userAgent = "AlphaWave";

        /// <summary>
        /// Initializes a new instance of the <see cref="OpenAIModel"/> class.
        /// </summary>
        /// <param name="options">Options for configuring `OpenAIModel`.</param>
        /// <param name="loggerFactory">The logger factory instance.</param>
        /// <param name="httpClient">HTTP client.</param>
        public OpenAIModel(BaseOpenAIModelOptions options, ILoggerFactory? loggerFactory = null, HttpClient? httpClient = null)
        {
            _options = options;
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();
            _httpClient = httpClient;

            _useAzure = options is AzureOpenAIModelOptions;
            OpenAIClientOptions openAIClientOptions = new()
            {
                RetryPolicy = new RetryPolicy(_options.RetryPolicy.Count, new ConfiguredDelayStrategy(_options.RetryPolicy))
            };
            openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), HttpPipelinePosition.PerCall);
            if (_httpClient != null)
            {
                openAIClientOptions.Transport = new HttpClientTransport(_httpClient);
            }

            if (_useAzure)
            {
                AzureOpenAIModelOptions azureOpenAIModelOptions = (AzureOpenAIModelOptions)options;
                openAIClientOptions.AddPolicy(new AddQueryRequestPolicy("api-version", azureOpenAIModelOptions.AzureApiVersion), HttpPipelinePosition.PerCall);
                _openAIClient = new OpenAIClient(new Uri(azureOpenAIModelOptions.AzureEndpoint), new AzureKeyCredential(azureOpenAIModelOptions.AzureApiKey), openAIClientOptions);
                _deploymentName = azureOpenAIModelOptions.AzureDefaultDeployment;
            }
            else
            {
                OpenAIModelOptions openAIModelOptions = (OpenAIModelOptions)options;
                if (!string.IsNullOrEmpty(openAIModelOptions.Organization))
                {
                    openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("OpenAI-Organization", openAIModelOptions.Organization!), HttpPipelinePosition.PerCall);
                }
                _openAIClient = new OpenAIClient(openAIModelOptions.ApiKey, openAIClientOptions);
                _deploymentName = openAIModelOptions.DefaultModel;
            }
        }

        /// <inheritdoc/>
        public async Task<PromptResponse> CompletePromptAsync(ITurnContext turnContext, IMemory memory, IPromptFunctions<List<string>> promptFunctions, ITokenizer tokenizer, PromptTemplate promptTemplate, CancellationToken cancellationToken = default)
        {
            DateTime startTime = DateTime.UtcNow;
            int maxInputTokens = promptTemplate.Configuration.Completion.MaxInputTokens;
            if (_options.CompletionType == CompletionType.Text)
            {
                // Render prompt
                RenderedPromptSection<string> prompt = await promptTemplate.Prompt.RenderAsTextAsync(turnContext, memory, promptFunctions, tokenizer, maxInputTokens);
                if (prompt.TooLong)
                {
                    return new PromptResponse
                    {
                        Status = PromptResponseStatus.TooLong,
                        Error = new Error
                        {
                            Message = $"The generated text completion prompt had a length of {prompt.Length} tokens which exceeded the MaxInputTokens of {maxInputTokens}."
                        }
                    };
                }
                if (_options.LogRequests)
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
                        promptResponse.Error = new Error
                        {
                            Message = "The text completion API returned a rate limit error."
                        };
                    }
                    else
                    {
                        promptResponse.Status = PromptResponseStatus.Error;
                        promptResponse.Error = new Error
                        {
                            Message = $"The text completion API returned an error status of {httpOperationException.StatusCode}: {httpOperationException.Message}"
                        };
                    }
                }

                if (_options.LogRequests)
                {
                    // TODO: Colorize
                    _logger.LogTrace("RESPONSE:");
                    _logger.LogTrace($"status {rawResponse!.Status}");
                    _logger.LogTrace($"duration {(DateTime.UtcNow - startTime).TotalMilliseconds} ms");
                    if (promptResponse.Status == PromptResponseStatus.Success)
                    {
                        _logger.LogTrace(JsonSerializer.Serialize(completionsResponse!.Value));
                    }
                    if (promptResponse.Status == PromptResponseStatus.RateLimited)
                    {
                        _logger.LogTrace("HEADERS:");
                        _logger.LogTrace(JsonSerializer.Serialize(rawResponse.Headers));
                    }
                }

                return promptResponse;
            }
            else
            {
                // Render prompt
                RenderedPromptSection<List<ChatMessage>> prompt = await promptTemplate.Prompt.RenderAsMessagesAsync(turnContext, memory, promptFunctions, tokenizer, maxInputTokens);
                if (prompt.TooLong)
                {
                    return new PromptResponse
                    {
                        Status = PromptResponseStatus.TooLong,
                        Error = new Error
                        {
                            Message = $"The generated chat completion prompt had a length of {prompt.Length} tokens which exceeded the MaxInputTokens of {maxInputTokens}."
                        }
                    };
                }
                if (!_options.UseSystemMessages && prompt.Output.Count > 0 && prompt.Output[0].Role == ChatRole.System)
                {
                    prompt.Output[0].Role = ChatRole.User;
                }
                if (_options.LogRequests)
                {
                    // TODO: Colorize
                    _logger.LogTrace("CHAT PROMPT:");
                    _logger.LogTrace(JsonSerializer.Serialize(prompt.Output));
                }

                // Call chat completion API
                IEnumerable<Azure.AI.OpenAI.ChatMessage> chatMessages = prompt.Output.Select(chatMessage => chatMessage.ToAzureSdkChatMessage());
                ChatCompletionsOptions chatCompletionsOptions = new(_deploymentName, chatMessages)
                {
                    MaxTokens = maxInputTokens,
                    Temperature = (float)promptTemplate.Configuration.Completion.Temperature,
                    NucleusSamplingFactor = (float)promptTemplate.Configuration.Completion.TopP,
                    PresencePenalty = (float)promptTemplate.Configuration.Completion.PresencePenalty,
                    FrequencyPenalty = (float)promptTemplate.Configuration.Completion.FrequencyPenalty,
                };

                Response? rawResponse;
                Response<ChatCompletions>? chatCompletionsResponse = null;
                PromptResponse promptResponse = new();
                try
                {
                    chatCompletionsResponse = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions, cancellationToken);
                    rawResponse = chatCompletionsResponse.GetRawResponse();
                    promptResponse.Status = PromptResponseStatus.Success;
                    promptResponse.Message = chatCompletionsResponse.Value.Choices[0].Message.ToChatMessage();
                }
                catch (RequestFailedException e)
                {
                    rawResponse = e.GetRawResponse();
                    HttpOperationException httpOperationException = e.ToHttpOperationException();
                    if (httpOperationException.StatusCode == (HttpStatusCode)429)
                    {
                        promptResponse.Status = PromptResponseStatus.RateLimited;
                        promptResponse.Error = new Error
                        {
                            Message = "The chat completion API returned a rate limit error."
                        };
                    }
                    else
                    {
                        promptResponse.Status = PromptResponseStatus.Error;
                        promptResponse.Error = new Error
                        {
                            Message = $"The chat completion API returned an error status of {httpOperationException.StatusCode}: {httpOperationException.Message}"
                        };
                    }
                }

                if (_options.LogRequests)
                {
                    // TODO: Colorize
                    _logger.LogTrace("RESPONSE:");
                    _logger.LogTrace($"status {rawResponse!.Status}");
                    _logger.LogTrace($"duration {(DateTime.UtcNow - startTime).TotalMilliseconds} ms");
                    if (promptResponse.Status == PromptResponseStatus.Success)
                    {
                        _logger.LogTrace(JsonSerializer.Serialize(chatCompletionsResponse!.Value));
                    }
                    if (promptResponse.Status == PromptResponseStatus.RateLimited)
                    {
                        _logger.LogTrace("HEADERS:");
                        _logger.LogTrace(JsonSerializer.Serialize(rawResponse.Headers));
                    }
                }

                return promptResponse;
            }
        }
    }
}
