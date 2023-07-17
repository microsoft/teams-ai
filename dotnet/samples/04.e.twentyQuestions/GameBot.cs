using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI;

namespace TwentyQuestions
{
    public class GameBot : Application<GameState, GameStateManager>
    {
        public GameBot(ApplicationOptions<GameState, GameStateManager> options)
            : base(options)
        {
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, GameState turnState, CancellationToken cancellationToken)
        {
            string? input = turnContext.Activity.Text?.Trim();
            string? secretWord = turnState.Conversation!.SecretWord;
            if (string.Equals("/quit", input, StringComparison.OrdinalIgnoreCase))
            {
                // Quit Game
                turnState.ConversationStateEntry?.Delete();
                await turnContext.SendActivityAsync(ResponseBuilder.QuitGame(secretWord), cancellationToken: cancellationToken);
            }
            else if (string.IsNullOrEmpty(secretWord))
            {
                // No secret word assigned, start game
                turnState.Conversation!.SecretWord = ResponseBuilder.PickSecretWord();
                turnState.Conversation!.GuessCount = 0;
                turnState.Conversation!.RemainingGuesses = 20;
                await turnContext.SendActivityAsync(ResponseBuilder.StartGame(), cancellationToken: cancellationToken);
            }
            else
            {
                int guessCount = turnState.Conversation!.GuessCount;
                int remainingGuesses = turnState.Conversation!.RemainingGuesses;
                guessCount++;
                remainingGuesses--;

                // Check correct guess
                if (!string.IsNullOrEmpty(input) && input.Contains(secretWord, StringComparison.OrdinalIgnoreCase))
                {
                    await turnContext.SendActivityAsync(ResponseBuilder.YouWin(secretWord), cancellationToken: cancellationToken);
                    secretWord = string.Empty;
                    guessCount = 0;
                    remainingGuesses = 0;
                }
                else if (remainingGuesses == 0)
                {
                    await turnContext.SendActivityAsync(ResponseBuilder.YouLose(secretWord), cancellationToken: cancellationToken);
                    secretWord = string.Empty;
                    guessCount = 0;
                    remainingGuesses = 0;
                }
                else
                {
                    // Ask for hint
                    string hint = await GetHint(turnContext, turnState, cancellationToken);
                    if (hint.Contains(secretWord, StringComparison.OrdinalIgnoreCase))
                    {
                        await turnContext.SendActivityAsync($"[{guessCount}] {ResponseBuilder.BlockSecretWord()}", cancellationToken: cancellationToken);
                    }
                    else if (remainingGuesses == 1)
                    {
                        await turnContext.SendActivityAsync($"[{guessCount}] {ResponseBuilder.LastGuess(hint)}", cancellationToken: cancellationToken);
                    }
                    else
                    {
                        await turnContext.SendActivityAsync($"[{guessCount}] {hint}", cancellationToken: cancellationToken);
                    }
                }

                // Save game state
                turnState.Conversation!.SecretWord = secretWord;
                turnState.Conversation!.GuessCount = guessCount;
                turnState.Conversation!.RemainingGuesses = remainingGuesses;
            }
        }

        private async Task<string> GetHint(ITurnContext turnContext, GameState turnState, CancellationToken cancellationToken)
        {
            // Set prompt variables
            AI.Prompts.Variables.Add("guessCount", turnState.Conversation!.GuessCount.ToString());
            AI.Prompts.Variables.Add("remainingGuesses", turnState.Conversation!.RemainingGuesses.ToString());
            AI.Prompts.Variables.Add("secretWord", turnState.Conversation!.SecretWord!);
            AI.Prompts.Variables.Add("input", turnContext.Activity.Text);

            string hint = await AI.CompletePromptAsync(turnContext, turnState, "Hint", null, cancellationToken);
            return hint ?? throw new Exception("The request to OpenAI was rate limited. Please try again later.");
        }
    }
}
