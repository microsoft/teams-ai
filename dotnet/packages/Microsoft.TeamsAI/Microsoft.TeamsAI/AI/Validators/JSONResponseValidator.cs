using System.Text.Json;
using Json.More;
using Json.Schema;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompts;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Validators
{
    /// <summary>
    /// Parses any JSON returned by the model and optionally verifies it against a JSON schema.
    /// </summary>
    public class JsonResponseValidator : IPromptResponseValidator
    {
        /// <summary>
        /// JSON schema to validate the response against.
        /// </summary>
        public readonly JsonSchema? Schema;

        /// <summary>
        /// Custom feedback to give when no JSON is returned.
        /// </summary>
        public readonly string MissingJsonFeedback;

        /// <summary>
        /// Custom feedback to give when an error is detected.
        /// </summary>
        public readonly string ErrorFeedback;

        /// <summary>
        /// Creates a new `JsonResponseValidator` instance.
        /// </summary>
        /// <param name="schema">JSON schema to validate the response against.</param>
        /// <param name="missingJsonFeedback">Custom feedback to give when no JSON is returned.</param>
        /// <param name="errorFeedback">Custom feedback to give when an error is detected.</param>
        public JsonResponseValidator(JsonSchema? schema = null, string? missingJsonFeedback = null, string? errorFeedback = null)
        {
            this.Schema = schema;
            this.MissingJsonFeedback = missingJsonFeedback ?? "No valid JSON objects were found in the response. Return a valid JSON object.";
            this.ErrorFeedback = errorFeedback ?? "The JSON returned had errors. Apply these fixes:";
        }

        /// <inheritdoc />
        public async Task<Validation> ValidateResponseAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts, CancellationToken cancellationToken = default)
        {
            string text = response.Message?.GetContent<string>() ?? "";
            List<Dictionary<string, JsonElement>> jsonObjects = ResponseJsonParsers.ParseAllObjects(text);

            if (jsonObjects.Count == 0)
            {
                return await Task.FromResult(new Validation()
                {
                    Valid = false,
                    Feedback = this.MissingJsonFeedback
                });
            }

            if (this.Schema != null)
            {
                List<KeyValuePair<string, string>> errors = new();

                foreach (Dictionary<string, JsonElement> jsonObject in jsonObjects)
                {
                    EvaluationResults res = this.Schema.Evaluate(jsonObject.AsJsonElement());

                    if (res.IsValid)
                    {
                        return await Task.FromResult(new Validation()
                        {
                            Valid = true,
                            Value = jsonObject
                        });
                    }

                    if (res.HasErrors && res.Errors != null)
                    {
                        errors.AddRange(res.Errors.AsEnumerable().ToList());
                    }
                }

                string errorText = string.Join("\n", errors.Select(e => $" - [{e.Key}]: {e.Value}"));

                return await Task.FromResult(new Validation()
                {
                    Valid = false,
                    Feedback = $"{this.ErrorFeedback}\n{errorText}"
                });
            }

            return await Task.FromResult(new Validation()
            {
                Valid = true,
                Value = jsonObjects.Last()
            });
        }
    }
}
