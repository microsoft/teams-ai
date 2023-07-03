using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.AI.Prompt;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.AI.Moderator
{
    public class DefaultModerator<TState> : IModerator<TState> where TState : TurnState
    {
        public Task<Plan> ReviewPlan(ITurnContext turnContext, TState turnState, Plan plan)
        {
            // Pass
            return Task.FromResult(plan);
        }

        public Task<Plan?> ReviewPrompt(ITurnContext turnContext, TState turnState, PromptTemplate prompt)
        {
            return Task.FromResult<Plan?>(null);
        }
    }
}