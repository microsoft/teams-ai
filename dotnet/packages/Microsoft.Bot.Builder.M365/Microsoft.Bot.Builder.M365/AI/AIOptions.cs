using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.SemanticKernel.SemanticFunctions;
using Microsoft.SemanticKernel.TemplateEngine;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI
{
    public class AIOptions<TState> where TState : TurnState
    {
        public IPlanner<TState> Planner { get; set; }
        public object PromptManager { get; set; }
        public Moderator<TState> Moderator { get; set; }
        public string? Prompt;
        public AIHistoryOptions? History;
    }
}
