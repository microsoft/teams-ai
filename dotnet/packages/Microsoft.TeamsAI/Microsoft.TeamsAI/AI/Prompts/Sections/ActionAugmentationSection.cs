﻿using Json.More;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using System.Text.Json;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// Base class for all prompt augmentations.
    /// </summary>
    public class ActionAugmentationSection : PromptSection
    {
        /// <summary>
        /// Actions
        /// </summary>
        public readonly Dictionary<string, ChatCompletionAction> Actions;

        private readonly string _text;
        private IReadOnlyList<int>? _tokens;

        private class ActionMap
        {
            public Dictionary<string, Action> Actions { get; set; } = new();

            public class Action
            {
                public string? Description { get; set; }
                public Dictionary<string, dynamic>? Parameters { get; set; }
            }
        }

        /// <summary>
        /// Creates an instance of `ActionAugmentationSection`
        /// </summary>
        /// <param name="actions">actions</param>
        /// <param name="callToAction">call to action</param>
        public ActionAugmentationSection(List<ChatCompletionAction> actions, string callToAction) : base(-1, true, "\n\n")
        {
            this.Actions = new();

            ActionMap actionMap = new();

            foreach (ChatCompletionAction action in actions)
            {
                this.Actions.Add(action.Name, action);

                actionMap.Actions.Add(action.Name, new()
                {
                    Description = action.Description,
                    Parameters = JsonSerializer.Deserialize<Dictionary<string, dynamic>>(action.Parameters.ToJsonDocument().RootElement.ToJsonString()),
                });
            }

            this._text = $"{JsonSerializer.Serialize(actionMap)}\n\n{callToAction}";
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            if (this._tokens == null)
            {
                this._tokens = tokenizer.Encode(this._text);
            }

            IReadOnlyList<int> tokens = this._tokens;
            bool tooLong = false;

            if (this._tokens.Count > maxTokens)
            {
                tokens = this._tokens.Take(maxTokens).ToList();
                tooLong = true;
            }

            List<ChatMessage> messages = new()
            { new(ChatRole.System) { Content = tokenizer.Decode(tokens) } };

            return await Task.FromResult(new RenderedPromptSection<List<ChatMessage>>(messages, tokens.Count, tooLong));
        }
    }
}
