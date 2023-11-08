using Microsoft.Bot.Builder;
using Microsoft.SemanticKernel.AI.TextCompletion;
using Microsoft.SemanticKernel.Orchestration;
using Microsoft.SemanticKernel.SkillDefinition;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Prompt
{
    internal sealed class SKFunctionWrapper<TState> : ISKFunction where TState : ITurnState<StateBase, StateBase, TempState>
    {
        // TODO: This is a hack around to get the default skill name from SK's internal implementation. We need to fix this.
        public const string DefaultSkill = "_GLOBAL_FUNCTIONS_";

        private PromptManager<TState> _promptManager;
        private TState _turnState;
        private ITurnContext _turnContext;

        public string Name { get; }

        public string SkillName => DefaultSkill;

        public string Description => string.Empty;

        public bool IsSemantic => false;

        public bool IsSensitive => false;

        public CompleteRequestSettings RequestSettings => throw new NotImplementedException();

        public SKFunctionWrapper(ITurnContext turnContext, TState turnState, string name, PromptManager<TState> promptManager)
        {
            Name = name;
            _promptManager = promptManager;
            _turnContext = turnContext;
            _turnState = turnState;
        }

        public FunctionView Describe()
        {
            throw new NotImplementedException();
        }

        public async Task<SKContext> InvokeAsync(SKContext context, CompleteRequestSettings? settings = null, CancellationToken cancellationToken = default)
        {
            string result = await _promptManager.InvokeFunction(_turnContext, _turnState, Name);
            context.Variables.Update(result);
            return context;
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
            return this;
        }
    }
}
