using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.M365;

namespace Microsoft.Bot.Builder.M365
{
    public class ApplicationOptions<TState> where TState : TurnState
    {
        public BotAdapter? adapter { get; set; }
        public string? botAppId { get; set; }
        public IStorage? storage { get; set; }
        public AIOptions<TState>? AI { get; set; }
        public TurnStateManager<TState>? turnStateManager { get; set; }
        public AdaptiveCardsOptions? adaptiveCards { get; set; }
        public bool removeRecipientMention { get; set; } = true;
        public bool startTypingTimer { get; set; } = true;
        public int typingTimerDelay = 1000;
    }
}
