using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI
{
    public class AIHistoryOptions
    {
        public bool TrackHistory { get; set; }
        public int MaxTurns { get; set; }
        public int MaxTokens { get; set; }
        public string LineSeparator { get; set; }
        public string UserPrefix { get; set; }
        public string AssistantPrefix { get; set; }
        public AssistantHistoryType AssistantHistoryType { get; set; }
    }

    public enum AssistantHistoryType
    {
        Text,
        PlanObject
    }
}
