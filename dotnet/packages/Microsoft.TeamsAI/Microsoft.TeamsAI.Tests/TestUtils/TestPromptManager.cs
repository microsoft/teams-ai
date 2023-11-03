using System.Reflection;

using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompt;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestPromptManager : IPromptManager<TestTurnState>
    {
        public IList<string> Record { get; } = new List<string>();

        public PromptTemplate RenderPromptResult { get; set; } = new PromptTemplate("Default", new());

        public IDictionary<string, string> Variables => throw new NotImplementedException();

        public IPromptManager<TestTurnState> AddFunction(string name, PromptFunction<TestTurnState> promptFunction, bool allowOverrides = false)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return this;
        }

        public IPromptManager<TestTurnState> AddPromptTemplate(string name, PromptTemplate promptTemplate)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return this;
        }

        public Task<string> InvokeFunction(ITurnContext turnContext, TestTurnState turnState, string name)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            throw new NotImplementedException();
        }

        public PromptTemplate LoadPromptTemplate(string name)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            throw new NotImplementedException();
        }

        public Task<PromptTemplate> RenderPromptAsync(ITurnContext turnContext, TestTurnState turnState, string name)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(RenderPromptResult);
        }

        public Task<PromptTemplate> RenderPromptAsync(ITurnContext turnContext, TestTurnState turnState, PromptTemplate promptTemplate)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(RenderPromptResult);
        }
    }
}
