using Microsoft.Bot.Builder;
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.AI.Planners;
using Microsoft.Teams.AI.AI.Prompts;

namespace TwentyQuestions
{
    public class GameBotHandlers
    {
        private readonly ActionPlanner<GameState> _actionPlanner;

        public GameBotHandlers(ActionPlanner<GameState> actionPlanner)
        {
            this._actionPlanner = actionPlanner;
        }

        public async Task OnMessageActivityAsync(ITurnContext turnContext, GameState turnState, CancellationToken cancellationToken)
        {
            string? input = turnContext.Activity.Text?.Trim();
            string? secretWord = turnState.Conversation!.SecretWord;
            if (string.Equals("/quit", input, StringComparison.OrdinalIgnoreCase))
            {
                // Quit Game
                turnState.DeleteConversationState();
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
            // Set input for prompt
            turnState.Temp!.Input = turnContext.Activity.Text;

            PromptTemplate template = _actionPlanner.Options.Prompts.GetPrompt("hint");
            // Set prompt variables
            PromptResponse response = await _actionPlanner.CompletePromptAsync(turnContext, turnState, template, null, cancellationToken);

            if (response.Status == PromptResponseStatus.Success && response.Message != null)
            {
                // Prompt completed successfully
                return response.Message.GetContent<string>()!;
            }

            throw new Exception($"An error occured when trying to make a call to the AI service: {response.Error}");
        }
    }
}
