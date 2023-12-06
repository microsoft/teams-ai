using Microsoft.Teams.AI.State;

namespace GPT.Model
{
    public class AppState : TurnState
    {
        public AppState()
        {
            ScopeDefaults[TEMP_SCOPE] = new AppTempState();
        }

        public new AppTempState Temp
        {
            get
            {
                TurnStateEntry? scope = GetScope(TEMP_SCOPE);

                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return (AppTempState)scope.Value!;
            }
            set
            {
                TurnStateEntry? scope = GetScope(TEMP_SCOPE);

                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                scope.Replace(value!);
            }
        }
    }

    public class AppTempState : TempState
    {
        public string? Post
        {
            get => Get<string?>("post");
            set => Set("post", value);
        }

        public string? Prompt
        {
            get => Get<string?>("prompt");
            set => Set("prompt", value);
        }
    }
}
