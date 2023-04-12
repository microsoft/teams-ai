using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.M365;

namespace Microsoft.Bot.Builder.M365
{
    public class ApplicationOptions<TState> where TState : TurnState
    {
        public BotAdapter? Adapter { get; set; }
        public string? BotAppId { get; set; }
        public IStorage? Storage { get; set; }
        public AIOptions<TState>? AI { get; set; }
        public TurnStateManager<TState>? TurnStateManager { get; set; }
        public bool RemoveRecipientMention { get; set; } = true;
        public bool StartTypingTimer { get; set; } = true;
        public int TypingTimerDelay { get; set; } = 1000;
    }
}
