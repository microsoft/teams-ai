using AdaptiveCards;
using Microsoft.Teams.AI.AI.Planner;
using System.Text.Json;

namespace Microsoft.Teams.AI.AI
{
    internal class ResponseParser
    {
        private static readonly string BREAKING_CHARACTERS = "`~!@#$%^&*()_+-={}|[]\\:\";\'<>?,./ \r\n\t";
        private static readonly string NAME_BREAKING_CHARACTERS = "`~!@#$%^&*()+={}|[]\\:\";\'<>?,./ \r\n\t";
        private static readonly string[] COMMANDS = { AIConstants.DoCommand, AIConstants.SayCommand };
        private static readonly string SPACE_CHARACTERS = "\r\n\t";
        private static readonly string DEFAULT_COMMAND = AIConstants.SayCommand;
        private static readonly string[] IGNORED_TOKENS = { "THEN" };

        /// <summary>
        /// Extract all the valid JSON strings within the input text and returns a list of objects.
        /// </summary>
        /// <param name="text">text that contains valid JSON object substrings</param>
        /// <returns>An ordered list of JSON strings</returns>
        public static List<string>? ParseJSON(string text)
        {
            int length = text.Length;

            if (length < 2)
            {
                return null;
            }

            List<string> result = new();

            int startIndex;
            int endIndex = -1;
            while (endIndex < length)
            {
                // Find the first "{"
                startIndex = text.IndexOf('{', endIndex + 1);
                if (startIndex == -1)
                {
                    return result;
                }

                // Find the first "}" such that all the contents sandwiched between S & E is a valid JSON.
                endIndex = startIndex;
                while (endIndex < length)
                {
                    endIndex = text.IndexOf('}', endIndex + 1);
                    if (endIndex == -1)
                    {
                        return result;
                    }

                    string possibleJSON = text.Substring(startIndex, endIndex - startIndex + 1);

                    // Validate string to be a valid JSON
                    try
                    {
                        JsonDocument.Parse(possibleJSON);
                    }
                    catch (JsonException)
                    {
                        continue;
                    }

                    result.Add(possibleJSON);
                    break;
                }
            }

            return result;
        }

        /// <summary>
        /// Extracts the first Adaptive Card JSON from the given string.
        /// </summary>
        /// <param name="text">text that contains valid JSON object substrings</param>
        /// <returns>Returns the first adaptive card in the string if it exists. Otherwise returns null</returns>
        public static AdaptiveCardParseResult? ParseAdaptiveCard(string text)
        {
            string? firstJsonString = GetFirstJsonString(text);

            if (firstJsonString == null)
            {
                return null;
            }

            return AdaptiveCard.FromJson(firstJsonString);
        }

        /// <summary>
        /// Parses a response and returns a plan.
        /// 
        /// If a plan object can be detected in the response it will be returned. Otherwise a plan with a single SAY command
        /// containing the response will be returned.
        /// </summary>
        /// <param name="text">Text to parse</param>
        /// <returns>The parsed plan</returns>
        public static Plan ParseResponse(string text)
        {
            Plan? plan = GetFirstPlanObject(text);

            if (plan != null)
            {
                if (AIConstants.Plan.Equals(plan.Type, StringComparison.OrdinalIgnoreCase))
                {
                    return plan;
                }
            }

            // Parse response using DO/SAY syntax
            string responses = "";
            Plan newPlan = new();
            List<string> tokens = TokenizeText(text);
            if (tokens.Count > 0)
            {
                // Insert default command if response doesn't start with a command
                if (!COMMANDS.Contains(tokens[0]))
                {
                    tokens.Insert(0, DEFAULT_COMMAND);
                }

                while (tokens.Count > 0)
                {
                    // Parse Command
                    ParsedCommandResult result;
                    switch (tokens[0])
                    {
                        case AIConstants.DoCommand:
                            result = ParseDoCommand(tokens);
                            break;

                        case AIConstants.SayCommand:
                        default:
                            result = ParseSayCommand(tokens);
                            break;
                    }

                    // Did we get a command back?
                    if (result.Length > 0)
                    {
                        // Add command to list if generated
                        // - In the case of `DO DO command` the first DO command wouldn't generate
                        if (result.Command != null)
                        {
                            if (AIConstants.SayCommand.Equals(result.Command.Type, StringComparison.OrdinalIgnoreCase))
                            {
                                // Check for duplicate SAY
                                string response = ((PredictedSayCommand)result.Command).Response.Trim().ToLower();
                                if (responses.IndexOf(response) < 0)
                                {
                                    responses += ' ' + response;
                                    newPlan.Commands.Add(result.Command);
                                }
                            }
                            else
                            {
                                newPlan.Commands.Add(result.Command);
                            }
                        }

                        // Remove consumed tokens
                        tokens = result.Length < tokens.Count ? tokens.GetRange(result.Length, tokens.Count - result.Length) : new();
                    }
                    else
                    {
                        // Ignore remaining tokens as something is malformed
                        tokens = new();
                    }
                }
            }

            return newPlan;
        }

        private static ParsedCommandResult ParseDoCommand(List<string> tokens)
        {
            int length = 0;
            PredictedDoCommand? command = null;

            if (tokens.Count > 1)
            {
                if (!AIConstants.DoCommand.Equals(tokens.First(), StringComparison.OrdinalIgnoreCase))
                {
                    throw new ArgumentException($"Token list passed in doesn't start with {AIConstants.DoCommand} token");
                }

                string actionName = "";
                string entityName = "";
                string entityValue = "";
                string quoteType = "";
                DoCommandParseState parseState = DoCommandParseState.FindActionName;

                // Skip the first "DO" token
                while (++length < tokens.Count)
                {
                    // Check for ignored tokens
                    string token = tokens[length];
                    if (IGNORED_TOKENS.Contains(token))
                    {
                        continue;
                    }

                    // Stop processing if a new command is hit
                    if (COMMANDS.Contains(token) && parseState != DoCommandParseState.InEntityStringValue)
                    {
                        break;
                    }

                    // Check for beginning of another command
                    switch (parseState)
                    {
                        case DoCommandParseState.FindActionName:
                        default:
                            // Ignore leading breaking characters
                            if (!BREAKING_CHARACTERS.Contains(token))
                            {
                                // Assign token to action name and enter new state
                                actionName = token;
                                parseState = DoCommandParseState.InActionName;
                            }
                            break;
                        case DoCommandParseState.InActionName:
                            // Accumulate tokens until you hit a breaking character
                            // - Underscores and dashes are allowed
                            if (NAME_BREAKING_CHARACTERS.Contains(token))
                            {
                                // Initialize command object and enter new state
                                command = new PredictedDoCommand(actionName);
                                parseState = DoCommandParseState.FindEntityName;
                            }
                            else
                            {
                                actionName += token;
                            };
                            break;
                        case DoCommandParseState.FindEntityName:
                            // Ignore leading breaking characters
                            if (!BREAKING_CHARACTERS.Contains(token))
                            {
                                // Assign token to entity name and enter new state
                                entityName = token;
                                parseState = DoCommandParseState.InEntityName;
                            }
                            break;
                        case DoCommandParseState.InEntityName:
                            // Accumulate tokens until you hit a breaking character
                            // - Underscores and dashes are allowed
                            if (NAME_BREAKING_CHARACTERS.Contains(token))
                            {
                                // We know the entity name so now we need the value
                                parseState = DoCommandParseState.FindEntityValue;
                            }
                            else
                            {
                                entityName += token;
                            }
                            break;
                        case DoCommandParseState.FindEntityValue:
                            // Look for either string quotes first non-space or equals token
                            if (token == "\"" || token == "'" || token == "`")
                            {
                                // Check for content value
                                if (token == "`" && tokens[length + 1] == "`" && tokens[length + 2] == "`")
                                {
                                    length += 2;
                                    parseState = DoCommandParseState.InEntityContentValue;
                                }
                                else
                                {
                                    // Remember quote type and enter new state
                                    quoteType = token;
                                    parseState = DoCommandParseState.InEntityStringValue;
                                }
                            }
                            else if (!SPACE_CHARACTERS.Contains(token) && token != "=")
                            {
                                // Assign token to value and enter new state
                                entityValue = token;
                                parseState = DoCommandParseState.InEntityValue;
                            }
                            break;
                        case DoCommandParseState.InEntityStringValue:
                            // The following code is checking that the tokens are matching and is not exposing sensitive data
                            // Accumulate tokens until end of string is hit
                            if (token == quoteType)
                            {
                                // Save pair and look for additional pairs
                                command!.Entities![entityName] = entityValue;
                                parseState = DoCommandParseState.FindEntityName;
                                entityName = entityValue = "";
                            }
                            else
                            {
                                entityValue += token;
                            }
                            break;
                        case DoCommandParseState.InEntityContentValue:
                            if (token == "`" && tokens[length + 1] == "`" && tokens[length + 2] == "`")
                            {
                                // Save pair and look for additional pairs
                                length += 2;
                                command!.Entities![entityName] = entityValue;
                                entityName = entityValue = "";
                            }
                            else
                            {
                                entityValue += token;
                            }
                            break;
                        case DoCommandParseState.InEntityValue:
                            // Accumulate tokens until you hit a space
                            if (SPACE_CHARACTERS.Contains(token))
                            {
                                command!.Entities![entityName] = entityValue;
                                parseState = DoCommandParseState.FindEntityName;
                                entityName = entityValue = "";
                            }
                            else
                            {
                                entityValue += token;
                            }
                            break;
                    }
                }

                // Create command if not created
                // This happens when a DO command without any entities is at the end of the response.
                if (command == null && actionName.Length > 0)
                {
                    command = new PredictedDoCommand(actionName);
                };

                if (command != null && entityName.Length > 0)
                {
                    command.Entities![entityName] = entityValue;
                }

            }

            return new ParsedCommandResult(length, command!);
        }

        internal static ParsedCommandResult ParseSayCommand(List<string> tokens)
        {
            int length = 0;
            IPredictedCommand? command = null;
            if (tokens.Count > 1)
            {
                if (!AIConstants.SayCommand.Equals(tokens.First(), StringComparison.OrdinalIgnoreCase))
                {
                    throw new ArgumentException($"Token list passed in doesn't start with {AIConstants.SayCommand} token");
                }

                // Parse command (skips initial SAY token)
                string response = "";
                while (++length < tokens.Count)
                {
                    // Check for ignored tokens
                    string token = tokens[length];
                    if (IGNORED_TOKENS.Contains(token))
                    {
                        continue;
                    }

                    // Stop processing if a new command is hit
                    if (COMMANDS.Contains(token))
                    {
                        break;
                    }

                    // Append token to output response
                    response += token;
                }

                // Create command
                if (response.Length > 0)
                {
                    command = new PredictedSayCommand(response);
                }
            }

            return new ParsedCommandResult(length, command!);
        }

        /// <summary>
        /// Simple text tokenizer. Breaking characters are added to list as separate tokens.
        /// </summary>
        /// <param name="text">Any input string</param>
        /// <returns>A list of tokens</returns>
        public static List<string> TokenizeText(string text)
        {
            List<string> tokens = new();

            if (text.Length < 1)
            {
                return tokens;
            }

            string token = "";
            int length = text.Length;
            for (int i = 0; i < length; i++)
            {
                string c = text[i].ToString();
                if (BREAKING_CHARACTERS.IndexOf(c) >= 0)
                {
                    // Push token onto list
                    if (token.Length > 0)
                    {
                        tokens.Add(token);
                    }

                    // Push breaking character onto list as a separate token
                    tokens.Add(c);

                    // Start a new empty token
                    token = "";
                }
                else
                {
                    // Add to existing token
                    token += c;
                }
            }

            // Add last token onto list
            if (token.Length > 0)
            {
                tokens.Add(token);
            }

            return tokens;
        }

        private static string? GetFirstJsonString(string text)
        {
            string? firstJSON;
            try
            {
                firstJSON = ParseJSON(text)?.First();
            }
            catch (InvalidOperationException)
            {
                // Empty sequence
                return null;
            }

            return firstJSON;
        }

        private static Plan? GetFirstPlanObject(string text)
        {
            string? firstJSON = GetFirstJsonString(text);
            if (firstJSON == null)
            {
                return null;
            }

            JsonSerializerOptions options = new();
            Plan? plan;

            try
            {
                plan = JsonSerializer.Deserialize<Plan>(firstJSON, options);
            }
            catch (JsonException)
            {
                // Json string is not a plan object
                return null;
            };

            return plan;
        }
    }

    internal enum DoCommandParseState
    {
        FindActionName,
        InActionName,
        FindEntityName,
        InEntityName,
        FindEntityValue,
        InEntityValue,
        InEntityStringValue,
        InEntityContentValue
    }
}
