using AdaptiveCards;
using Microsoft.Bot.Builder.M365.AI.Planner;
using Microsoft.Bot.Builder.M365.Exceptions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI
{
    public class ResponseParser
    {
        private static readonly string BREAKING_CHARACTERS = "`~!@#$%^&*()_+-={}|[]\\:\";\'<>?,./ \r\n\t";
        private static readonly string NAME_BREAKING_CHARACTERS = "`~!@#$%^&*()+={}|[]\\:\";\'<>?,./ \r\n\t";
        private static readonly string[] COMMANDS = { AITypes.DoCommand, AITypes.SayCommand };
        private static readonly string SPACE_CHARACTERS = "\r\n\t";
        private static readonly string DEFAULT_COMMAND = AITypes.SayCommand;
        private static readonly string[] IGNORED_TOKENS = { "THEN" };

        /// <summary>
        /// Extract all the valid json strings within the input text and returns a list of objects.
        /// </summary>
        /// <param name="text">text that contains valid json object substrings</param>
        /// <returns>An ordered list of json strings</returns>
        public static List<string>? ParseJson(string text)
        {
            int length = text.Length;

            if (length < 2) return null;

            var result = new List<string>();

            int startIndex;
            int endIndex = -1;
            while (endIndex < length)
            {
                // Find the first "{"
                startIndex = text.IndexOf('{', endIndex + 1);
                if (startIndex == -1) return result;

                // Find the first "}" such that all the contents sandwiched between S & E is a valid json.
                endIndex = FindValidJsonStructure(text, startIndex);

                if (endIndex == -1) return result;

                string possibleJson = text.Substring(startIndex, endIndex - startIndex + 1);

                // Validate string to be a valid json
                try
                {
                    JToken.Parse(possibleJson);
                }
                catch (JsonReaderException)
                {
                    continue;
                }

                result.Add(possibleJson);
            }

            return result;
        }

        /// <summary>
        /// Extracts the first Adaptive Card json from the given string.
        /// </summary>
        /// <param name="text">text that contains valid json object substrings</param>
        /// <returns>The first adaptive card in the string if it exists. Otherwise returns null</returns>
        public static AdaptiveCardParseResult? ParseAdaptiveCard(string text)
        {
            string? firstJson = GetFirstJsonString(text);

            if (firstJson == null) return null;

            return AdaptiveCard.FromJson(firstJson);
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

            if (plan != null && AITypes.Plan.Equals(plan.Type, StringComparison.OrdinalIgnoreCase))
            {
                return plan;
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
                        case AITypes.DoCommand:
                            result = ParseDoCommand(tokens);
                            break;

                        case AITypes.SayCommand:
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
                            if (AITypes.SayCommand.Equals(result.Command.Type, StringComparison.OrdinalIgnoreCase))
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

        /// <summary>
        /// Simple text tokensizer. Breaking characters are added to list as separate tokens.
        /// </summary>
        /// <param name="text">Any input string</param>
        /// <returns>A list of tokens</returns>
        public static List<string> TokenizeText(string text)
        {
            List<string> tokens = new();

            if (text.Length < 1) return tokens;

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

        private static ParsedCommandResult ParseDoCommand(List<string> tokens)
        {
            int length = 0;
            PredictedDoCommand? command = null;

            if (tokens.Count > 1)
            {
                if (!AITypes.DoCommand.Equals(tokens.First(), StringComparison.OrdinalIgnoreCase))
                {
                    throw new ResponseParserException($"Token list passed in doesn't start with {AITypes.DoCommand} token");
                }

                StringBuilder actionName = new();
                StringBuilder entityName = new();
                StringBuilder entityValue = new();
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
                                actionName = new StringBuilder(token);
                                parseState = DoCommandParseState.InActionName;
                            }
                            break;
                        case DoCommandParseState.InActionName:
                            // Accumulate tokens until you hit a breaking character
                            // - Underscores and dashes are allowed
                            if (NAME_BREAKING_CHARACTERS.Contains(token))
                            {
                                // Initialize command object and enter new state
                                command = new PredictedDoCommand(actionName.ToString());
                                parseState = DoCommandParseState.FindEntityName;
                            }
                            else
                            {
                                actionName.Append(token);
                            };
                            break;
                        case DoCommandParseState.FindEntityName:
                            // Ignore leading breaking characters
                            if (!BREAKING_CHARACTERS.Contains(token))
                            {
                                // Assign token to entity name and enter new state
                                entityName = new StringBuilder(token);
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
                                entityName.Append(token);
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
                                entityValue = new StringBuilder(token);
                                parseState = DoCommandParseState.InEntityValue;
                            }
                            break;
                        case DoCommandParseState.InEntityStringValue:
                            // The following code is checking that the tokens are matching and is not exposing sensitive data
                            // Accumulate tokens until end of string is hit
                            if (token == quoteType)
                            {
                                // Save pair and look for additional pairs
                                command!.Entities![entityName.ToString()] = entityValue.ToString();
                                parseState = DoCommandParseState.FindEntityName;
                                entityName = new();
                                entityValue = new StringBuilder();
                            }
                            else
                            {
                                entityValue.Append(token);
                            }
                            break;
                        case DoCommandParseState.InEntityContentValue:
                            if (token == "`" && tokens[length + 1] == "`" && tokens[length + 2] == "`")
                            {
                                // Save pair and look for additional pairs
                                length += 2;
                                command!.Entities![entityName.ToString()] = entityValue.ToString();
                                entityName = new();
                                entityValue = new StringBuilder();
                            }
                            else
                            {
                                entityValue.Append(token);
                            }
                            break;
                        case DoCommandParseState.InEntityValue:
                            // Accumulate tokens until you hit a space
                            if (SPACE_CHARACTERS.Contains(token))
                            {
                                command!.Entities![entityName.ToString()] = entityValue.ToString();
                                parseState = DoCommandParseState.FindEntityName;
                                entityName = new();
                                entityValue = new StringBuilder();
                            }
                            else
                            {
                                entityValue.Append(token);
                            }
                            break;
                    }
                }

                // Create command if not created
                // This happens when a DO command without any entities is at the end of the response.
                if (command == null && actionName.Length > 0)
                {
                    command = new PredictedDoCommand(actionName.ToString());
                };

                if (command != null && entityName.Length > 0)
                {
                    command!.Entities![entityName.ToString()] = entityValue.ToString();
                }

            }

            return new ParsedCommandResult(length, command!);
        }

        private static ParsedCommandResult ParseSayCommand(List<string> tokens)
        {
            int length = 0;
            PredictedCommand? command = null;
            if (tokens.Count > 1)
            {
                if (!AITypes.SayCommand.Equals(tokens.First(), StringComparison.OrdinalIgnoreCase))
                {
                    throw new ResponseParserException($"Token list passed in doesn't start with {AITypes.SayCommand} token");
                }

                // Parse command (skips initial SAY token)
                StringBuilder response = new StringBuilder();
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
                    response.Append(token);
                }

                // Create command
                if (response.Length > 0)
                {
                    command = new PredictedSayCommand(response.ToString());
                }
            }

            return new ParsedCommandResult(length, command!);
        }

        private static string? GetFirstJsonString(string text)
        {
            try
            {
                return ParseJson(text)?.First();
            }
            catch (InvalidOperationException)
            {
                // Empty sequence
                return null;
            }
        }

        private static Plan? GetFirstPlanObject(string text)
        {
            string? firstJson = GetFirstJsonString(text);
            if (firstJson == null) return null;

            JsonSerializerSettings settings = new()
            {
                Converters = new List<JsonConverter> { new PredictedCommandJsonConverter() }
            };

            try
            {
                return JsonConvert.DeserializeObject<Plan>(firstJson, settings);
            } catch (Exception ex)
            {
                throw new ResponseParserException("Unable to deserialize plan json string", ex);
            }
        }

        private static int FindValidJsonStructure(string text, int startIndex)
        {
                   
            if (string.IsNullOrEmpty(text) || text.Length < 2) return -1;

            if (text[startIndex] != '{') 
            {
                return -1;
            }

            int parenthesisStack = 0;

            int i = startIndex;
            while (i < text.Length)
            {
                int c = text.IndexOfAny(new char[] { '{', '}' }, i);

                if (c == -1) break;

                if (text[c] == '{')
                {
                    parenthesisStack += 1;
                } else if (text[c] == '}')
                {
                    parenthesisStack -= 1;

                    if (parenthesisStack < 0)
                    {
                        return -1;
                    }
                    else if (parenthesisStack == 0)
                    {
                        // Found a valid json structure, return the index of '}'
                        return c;
                    }
                }

                i = c + 1;
            }

            return -1;
        }
    }

    enum DoCommandParseState
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
