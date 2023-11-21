using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using System.Text.Json;

namespace Microsoft.Teams.AI.AI.Validators
{
    /// <summary>
    /// Validated Chat Completion Action
    /// </summary>
    public class ValidatedChatCompletionAction
    {
        /// <summary>
        /// Name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Parameters
        /// </summary>
        public Dictionary<string, JsonElement> Parameters { get; set; } = new();
    }

    /// <summary>
    /// Validates action calls returned by the model.
    /// </summary>
    public class ActionResponseValidator : IPromptResponseValidator
    {
        /// <summary>
        /// List of supported actions.
        /// </summary>
        public readonly Dictionary<string, ChatCompletionAction> Actions;

        /// <summary>
        /// Name of the action to use in feedback messages. Defaults to `action`.
        /// </summary>
        public readonly string Noun;

        private readonly bool _required;

        /// <summary>
        /// Creates a new `ActionResponseValidator` instance.
        /// </summary>
        /// <param name="actions">List of supported actions.</param>
        /// <param name="required">Whether the response is required to call an action.</param>
        /// <param name="noun">Name of the action to use in feedback messages. Defaults to `action`.</param>
        public ActionResponseValidator(List<ChatCompletionAction> actions, bool required = false, string noun = "action")
        {
            this.Noun = noun;
            this._required = required;
            this.Actions = new();

            foreach (ChatCompletionAction action in actions)
            {
                this.Actions.Add(action.Name, action);
            }
        }

        /// <inheritdoc />
        public async Task<Validation> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts)
        {
            if (response.Message?.FunctionCall == null && this._required == false)
            {
                return await Task.FromResult(new Validation()
                {
                    Valid = true
                });
            }

            if (response.Message?.FunctionCall != null)
            {
                FunctionCall func = response.Message.FunctionCall;

                if (func.Name == string.Empty)
                {
                    return await Task.FromResult(new Validation()
                    {
                        Valid = false,
                        Feedback = $"{this.Noun} name missing. Specify a valid {this.Noun} name."
                    });
                }

                if (!this.Actions.ContainsKey(func.Name))
                {
                    return await Task.FromResult(new Validation()
                    {
                        Valid = false,
                        Feedback = $"Unknown {this.Noun} named \"{func.Name}\". Specify a valid {this.Noun} name."
                    });
                }

                Dictionary<string, JsonElement> parameters = new();
                ChatCompletionAction action = this.Actions[func.Name];

                if (action.Parameters != null)
                {
                    JsonResponseValidator validator = new(
                        action.Parameters,
                        $"No arguments were sent with called {this.Noun}. Call the \"{func.Name}\" {this.Noun} with required arguments as a valid JSON object.",
                        $"This {this.Noun} arguments had errors. Apply these fixes and call \"{func.Name}\" {this.Noun} again:"
                    );

                    string args = func.Arguments == "{}" ? "" : func.Arguments;
                    ChatMessage message = new(ChatRole.Assistant) { Content = args };
                    Validation result = await validator.ValidateResponseAsync(
                        context, memory, tokenizer, new() { Status = PromptResponseStatus.Success, Message = message }, remainingAttempts);

                    if (!result.Valid)
                    {
                        return await Task.FromResult(new Validation()
                        {
                            Valid = false,
                            Feedback = result.Feedback
                        });
                    }

                    if (result.Value != null)
                    {
                        parameters = (Dictionary<string, JsonElement>)result.Value;
                    }
                }

                return await Task.FromResult(new Validation()
                {
                    Valid = true,
                    Value = new ValidatedChatCompletionAction()
                    {
                        Name = func.Name,
                        Parameters = parameters
                    }
                });
            }

            return await Task.FromResult(new Validation()
            {
                Valid = false,
                Feedback = $"No {this.Noun} was specified. Call a {this.Noun} with valid arguments."
            });
        }
    }
}
