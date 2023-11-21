using System.Reflection;

using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestPromptManager : IPromptManager<TurnState>
    {
        public IList<string> Record { get; } = new List<string>();

        public PromptTemplate RenderPromptResult { get; set; } = new PromptTemplate("Default", new());

        public IDictionary<string, string> Variables => throw new NotImplementedException();

        public IPromptManager<TurnState> AddFunction(string name, PromptFunction<TurnState> promptFunction, bool allowOverrides = false)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return this;
        }

        public IPromptManager<TurnState> AddPromptTemplate(string name, PromptTemplate promptTemplate)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return this;
        }

        public Task<string> InvokeFunction(ITurnContext turnContext, TurnState turnState, string name)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            throw new NotImplementedException();
        }

        public PromptTemplate LoadPromptTemplate(string name)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            throw new NotImplementedException();
        }

        public Task<PromptTemplate> RenderPromptAsync(ITurnContext turnContext, TurnState turnState, string name)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(RenderPromptResult);
        }

        public Task<PromptTemplate> RenderPromptAsync(ITurnContext turnContext, TurnState turnState, PromptTemplate promptTemplate)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(RenderPromptResult);
        }
    }
}
