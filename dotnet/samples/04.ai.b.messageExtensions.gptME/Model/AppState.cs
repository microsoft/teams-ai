using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace GPT.Model
{
    public class AppState : TurnState
    {
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

        /// <summary>
        /// Compute default values for each scope. If not set then <see cref="Record"/> will be used by default.
        /// </summary>
        /// <param name="context">The turn context.</param>
        /// <returns>The default values for each scope.</returns>
        protected override Dictionary<string, Record> OnComputeScopeDefaults(ITurnContext context)
        {
            Dictionary<string, Record> defaults = base.OnComputeScopeDefaults(context);
            defaults[TEMP_SCOPE] = new AppTempState();
            return defaults;
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
