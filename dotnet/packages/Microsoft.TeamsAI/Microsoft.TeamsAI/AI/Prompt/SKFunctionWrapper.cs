﻿using Microsoft.Bot.Builder;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel.AI.TextCompletion;
using Microsoft.SemanticKernel.Memory;
using Microsoft.SemanticKernel.Orchestration;
using Microsoft.SemanticKernel.Security;
using Microsoft.SemanticKernel.SkillDefinition;
using Microsoft.TeamsAI.State;

namespace Microsoft.TeamsAI.AI.Prompt
{
    internal class SKFunctionWrapper<TState> : ISKFunction where TState : ITurnState<StateBase, StateBase, TempState>
    {
        // TODO: This is a hack around to get the default skill name from SK's internal implementation. We need to fix this.
        public const string DefaultSkill = "_GLOBAL_FUNCTIONS_";

        private string _name;
        private PromptManager<TState> _promptManager;
        private TState _turnState;
        private ITurnContext _turnContext;
        private IReadOnlySkillCollection? _skillCollection;

        public string Name => _name;

        public string SkillName => DefaultSkill;

        public string Description => string.Empty;

        public bool IsSemantic => false;

        public bool IsSensitive => false;

        public ITrustService TrustServiceInstance => throw new NotImplementedException();

        public CompleteRequestSettings RequestSettings => throw new NotImplementedException();

        public SKFunctionWrapper(ITurnContext turnContext, TState turnState, string name, PromptManager<TState> promptManager)
        {
            _name = name;
            _promptManager = promptManager;
            _turnContext = turnContext;
            _turnState = turnState;
        }

        public FunctionView Describe()
        {
            throw new NotImplementedException();
        }

        public async Task<SKContext> InvokeAsync(SKContext context, CompleteRequestSettings? settings = null)
        {
            string result = await _promptManager.InvokeFunction(_turnContext, _turnState, _name);
            context.Variables.Update(result);
            return context;
        }

        public Task<SKContext> InvokeAsync(string? input = null, CompleteRequestSettings? settings = null, ISemanticTextMemory? memory = null, ILogger? logger = null, CancellationToken cancellationToken = default)
        {
            SKContext context = new(
                memory: memory,
                logger: logger,
                cancellationToken: cancellationToken,
                skills: _skillCollection
            );

            return InvokeAsync(context, settings);
        }

        public ISKFunction SetAIConfiguration(CompleteRequestSettings settings)
        {
            throw new NotImplementedException();
        }

        public ISKFunction SetAIService(Func<ITextCompletion> serviceFactory)
        {
            throw new NotImplementedException();
        }

        public ISKFunction SetDefaultSkillCollection(IReadOnlySkillCollection skills)
        {
            _skillCollection = skills;
            return this;
        }
    }
}
