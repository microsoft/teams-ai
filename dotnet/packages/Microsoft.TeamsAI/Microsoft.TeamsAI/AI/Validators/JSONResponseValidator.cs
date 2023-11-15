using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.Memory;
using Newtonsoft.Json.Schema;
using System;
using System.Collections.Generic;
using System.Data;
using System.Net.NetworkInformation;
using System.Text;

namespace Microsoft.Teams.AI.AI.Validators
{
    public class JSONResponseValidator: IPromptResponseValidator<Dictionary<string, object?>>
    {
        public readonly string ErrorFeedback;
        public readonly string? InstanceName;
        public readonly string MissingJsonFeedback;
        public readonly JsonSchema? Schema;
        public JSONResponseValidator(JsonSchema? schema, string? missingJsonFeedback, string? errorFeedback)
        {
            this.Schema = schema;
            this.MissingJsonFeedback = missingJsonFeedback ?? "No valid JSON objects were found in the response. Return a valid JSON object.";
            this.ErrorFeedback = errorFeedback ?? "The JSON returned had errors. Apply these fixes:";
        }

        public async Task<Validation<Dictionary<string, object?>>> ValidateResponse(TurnContext context, IMemory memory, ITokenizer tokenizer, PromptResponse response, int remainingAttempts)
        {
            string text = response.Message?.Content ?? "";

            //TODO
        }
    }
}
