using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Prompt;

namespace TwentyQuestions
{
    public class GameBot : Application<GameTurnState, GameTurnStateManager>
    {
        public GameBot(ApplicationOptions<GameTurnState, GameTurnStateManager> options)
            : base(options)
        {
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, GameTurnState turnState, CancellationToken cancellationToken)
        {
            string? input = turnContext.Activity.Text?.Trim();
            string? secretWord = turnState.SecretWord;
            if (string.Equals("/quit", input, StringComparison.OrdinalIgnoreCase))
            {
                // Quit Game
                turnState.ConversationStateEntry?.Delete();
                await turnContext.SendActivityAsync(ResponseBuilder.QuitGame(secretWord), cancellationToken: cancellationToken);
            }
            else if (string.IsNullOrEmpty(secretWord))
            {
                // No secret word assigned, start game
                turnState.SecretWord = ResponseBuilder.PickSecretWord();
                turnState.GuessCount = 0;
                turnState.RemainingGuesses = 20;
                await turnContext.SendActivityAsync(ResponseBuilder.StartGame(), cancellationToken: cancellationToken);
            }
            else
            {
                int guessCount = turnState.GuessCount;
                int remainingGuesses = turnState.RemainingGuesses;
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
                turnState.SecretWord = secretWord;
                turnState.GuessCount = guessCount;
                turnState.RemainingGuesses = remainingGuesses;
            }
        }

        private async Task<string> GetHint(ITurnContext turnContext, GameTurnState turnState, CancellationToken cancellationToken)
        {
            turnState.Temp!.Input = turnContext.Activity.Text;

            // Set prompt variables
            ((PromptManager<GameTurnState>)AI.Prompts).Variables.Add("guessCount", turnState.GuessCount.ToString());
            ((PromptManager<GameTurnState>)AI.Prompts).Variables.Add("remainingGuesses", turnState.RemainingGuesses.ToString());
            ((PromptManager<GameTurnState>)AI.Prompts).Variables.Add("secretWord", turnState.SecretWord!);

            string hint = await AI.CompletePromptAsync(turnContext, turnState, "Hint", null, cancellationToken);
            return hint ?? throw new Exception("The request to OpenAI was rate limited. Please try again later.");
        }
    }
}
