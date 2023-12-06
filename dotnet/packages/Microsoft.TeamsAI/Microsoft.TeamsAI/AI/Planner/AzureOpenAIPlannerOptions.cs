﻿using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// Additional options needed to use the Azure OpenAI service.
    /// </summary>
    /// <remarks>
    /// The Azure OpenAI API version is set to latest by default.
    /// </remarks>
    public class AzureOpenAIPlannerOptions<TState> : OpenAIPlannerOptions<TState>
        where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <summary>
        /// Endpoint for your Azure OpenAI deployment.
        /// </summary>
        public new string Endpoint { get; set; }

        /// <summary>
        /// Create an instance of the OpenAIPlannerOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="defaultModel">The default model to use. This should be the model deployment name, not the model</param>
        /// <param name="endpoint">Endpoint for your Azure OpenAI deployment.</param>
        /// <param name="prompts">The prompt manager.</param>
        /// <param name="defaultPrompt">The default prompt.</param>
        /// <param name="history">The history options.</param>
        public AzureOpenAIPlannerOptions(string apiKey, string defaultModel, string endpoint, IPromptManager<TState> prompts, string defaultPrompt, OpenAIPlannerHistoryOptions? history = null)
            : base(apiKey, defaultModel, prompts, defaultPrompt, history)
        {
            Verify.ParamNotNull(endpoint);

            Endpoint = endpoint;
        }
    }
}
