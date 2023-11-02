using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Microsoft.SemanticKernel.Connectors.AI.OpenAI.Tokenizers;
using System.Text;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// Class that provides utility methods for working with conversation history.
    /// </summary>
    public class ConversationHistory
    {
        /// <summary>
        /// The name of the conversation state property that stores the conversation history.
        /// </summary>
        public static readonly string StatePropertyName = "__history__";

        /// <summary>
        /// Adds a new line of text to conversation history
        /// </summary>
        /// <param name="turnState">Applications turn state.</param>
        /// <param name="line">Line of text to add to history.</param>
        /// <param name="maxLines">Optional. Maximum number of lines to store. Defaults to 10.</param>
        public static void AddLine(ITurnState<StateBase, StateBase, TempState> turnState, string line, int maxLines = 10)
        {
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(line);

            _VerifyConversationState(turnState);

            // Create history array if it doesn't exist
            List<string> history = GetHistory(turnState);

            // Add line to history
            history.Add(line);

            // Prune history if too long
            if (history.Count > maxLines)
            {
                history.RemoveRange(0, history.Count - maxLines);
            }

            // Save history back to conversation state
            _SetHistory(turnState, history);
        }

        /// <summary>
        /// Appends text to the last line of conversation history.
        /// </summary>
        /// <param name="turnState">The turn state.</param>
        /// <param name="text">The input text.</param>
        public static void AppendToLastLine(ITurnState<StateBase, StateBase, TempState> turnState, string text)
        {
            string line = GetLastLine(turnState);
            ReplaceLastLine(turnState, line + text);
        }

        /// <summary>
        /// Clears all conversation history for the current conversation.
        /// </summary>
        /// <param name="turnState">Applications turn state.</param>
        public static void Clear(ITurnState<StateBase, StateBase, TempState> turnState)
        {
            Verify.ParamNotNull(turnState);
            _VerifyConversationState(turnState);

            _SetHistory(turnState, new List<string>());
        }

        /// <summary>
        /// Checks to see if one or more lines of history has persisted.
        /// </summary>
        /// <param name="turnState">Applications turn state.</param>
        /// <returns>True if there are 1 or more lines of history.</returns>
        public static bool HasMoreLines(ITurnState<StateBase, StateBase, TempState> turnState)
        {
            Verify.ParamNotNull(turnState);
            _VerifyConversationState(turnState);

            List<string> history = GetHistory(turnState);
            return history.Count > 0;
        }

        /// <summary>
        /// Returns the last line of history.
        /// </summary>
        /// <param name="turnState">Applications turn state.</param>
        /// <returns>The last line of history or an empty string.</returns>
        public static string GetLastLine(ITurnState<StateBase, StateBase, TempState> turnState)
        {
            Verify.ParamNotNull(turnState);
            _VerifyConversationState(turnState);

            List<string> history = GetHistory(turnState);
            return history.Count > 0 ? history[history.Count - 1] : string.Empty;
        }

        /// <summary>
        /// Searches the history to find the last SAY response from the assistant.
        /// </summary>
        /// <param name="turnState">Applications turn state.</param>
        /// <returns>Last thing said by the assistant. Defaults to an empty string.</returns>
        public static string GetLastSay(ITurnState<StateBase, StateBase, TempState> turnState)
        {
            // Find start of text
            string lastLine = GetLastLine(turnState);
            int textPos = lastLine.LastIndexOf(" SAY ");
            if (textPos >= 0)
            {
                textPos += 5;
            }
            else
            {
                // Find end of prefix
                textPos = lastLine.IndexOf(": ");
                if (textPos >= 0)
                {
                    textPos += 2;
                }
                else
                {
                    // Just use whole text
                    textPos = 0;
                }
            }

            // Trim off any DO statements
            string text = lastLine.Substring(textPos);
            int doPos = text.IndexOf(" THEN DO ");
            if (doPos >= 0)
            {
                text = text.Substring(0, doPos);
            }
            else
            {
                doPos = text.IndexOf(" DO ");
                if (doPos >= 0)
                {
                    text = text.Substring(0, doPos);
                }
            }

            return text.IndexOf("DO ") < 0 ? text.Trim() : string.Empty;
        }

        /// <summary>
        /// Removes the last line from the conversation history.
        /// </summary>
        /// <param name="turnState">Applications turn state.</param>
        /// <returns>The removed line or null.</returns>
        public static string? RemoveLastLine(ITurnState<StateBase, StateBase, TempState> turnState)
        {
            Verify.ParamNotNull(turnState);

            // Get history array
            List<string> history = GetHistory(turnState);

            if (history.Count < 1)
            {
                return null;
            }

            // Remove last line
            string? line = history[history.Count - 1];
            history.RemoveAt(history.Count - 1);

            // Save history back to conversation state
            _SetHistory(turnState, history);

            // Return removed line
            return line;
        }

        /// <summary>
        /// Replaces the last line of history with a new line.
        /// </summary>
        /// <param name="turnState">Applications turn state.</param>
        /// <param name="line">New line of history.</param>
        public static void ReplaceLastLine(ITurnState<StateBase, StateBase, TempState> turnState, string line)
        {
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(line);

            // Get history array
            List<string> history = GetHistory(turnState);

            // Replace the last line or add a new one
            if (history.Count > 0)
            {
                history[history.Count - 1] = line;
            }
            else
            {
                history.Add(line);
            }

            // Save history back to conversation state
            _SetHistory(turnState, history);
        }


        /// <summary>
        /// Replaces the last line's SAY with a new response.
        /// </summary>
        /// <param name="turnState">Applications turn state.</param>
        /// <param name="newResponse">New response from the assistant.</param>
        /// <param name="assistantPrefix">Prefix for when a new line needs to be inserted. Defaults to 'Assistant:'.</param>
        public static void ReplaceLastSay(ITurnState<StateBase, StateBase, TempState> turnState, string newResponse, string assistantPrefix = "Assistant:")
        {
            Verify.ParamNotNull(turnState);
            Verify.ParamNotNull(newResponse);

            // Get history array if it exists
            List<string> history = GetHistory(turnState);

            // Update the last line or add a new one
            if (history.Count > 0)
            {
                string line = history[history.Count - 1];
                int lastSayPos = line.LastIndexOf(" SAY ");
                if (lastSayPos >= 0 && line.IndexOf(" DO ", lastSayPos) < 0)
                {
                    // We found the last SAY and it wasn't followed by a DO
                    history[history.Count - 1] = $"{line.Substring(0, lastSayPos)} SAY {newResponse}";
                }
                else if (line.IndexOf(" DO ") >= 0)
                {
                    // Append a THEN SAY after the DO's
                    history[history.Count - 1] = $"{line} THEN SAY {newResponse}";
                }
                else
                {
                    // Just replace the entire line
                    history[history.Count - 1] = $"{assistantPrefix.Trim()} {newResponse}";
                }
            }
            else
            {
                history.Add($"{assistantPrefix.Trim()} {newResponse}");
            }

            // Save history back to conversation state
            _SetHistory(turnState, history);
        }

        /// <summary>
        /// Returns the current conversation history as a string of text.
        /// </summary>
        /// <remarks>
        /// The length of the returned text is gated by <paramref name="maxTokens"/> and only whole lines of
        /// history entries will be returned. That means that if the length of the most recent history
        /// entry is greater then <paramref name="maxTokens"/>, no text will be returned.
        /// </remarks>
        /// <param name="turnState">Application's turn state.</param>
        /// <param name="maxTokens">Optional. Maximum length of the text returned. Defaults to 1000 tokens.</param>
        /// <param name="lineSeparator">Optional. Separator used between lines. Defaults to '\n'.</param>
        /// <returns>The most recent lines of conversation history as a text string.</returns>
        public static string ToString(ITurnState<StateBase, StateBase, TempState> turnState, int maxTokens = 1000, string lineSeparator = "\n")
        {
            Verify.ParamNotNull(turnState);

            // Get history array if it exists
            List<string> history = GetHistory(turnState);

            // Populate up to max chars
            StringBuilder text = new();
            int textTokens = 0;
            int lineSeparatorTokens = GPT3Tokenizer.Encode(lineSeparator).Count;
            for (int i = history.Count - 1; i >= 0; i--)
            {
                // Ensure that adding line won't go over the max character length
                string line = history[i];
                int lineTokens = GPT3Tokenizer.Encode(line).Count;
                int newTextTokens = textTokens + lineTokens + lineSeparatorTokens;
                if (newTextTokens > maxTokens)
                {
                    break;
                }

                // Prepend line to output
                text.Insert(0, $"{line}{lineSeparator}");
                textTokens = newTextTokens;
            }

            return text.ToString().Trim();
        }

        /// <summary>
        /// Returns the current conversation history as an array of lines.
        /// </summary>
        /// <param name="turnState">The Application's turn state.</param>
        /// <param name="maxTokens">Optional. Maximum length of the text to include. Defaults to 1000 tokens.</param>
        /// <returns>The most recent lines of conversation history as an array.</returns>
        public static string[] ToArray(ITurnState<StateBase, StateBase, TempState> turnState, int maxTokens = 1000)
        {
            Verify.ParamNotNull(turnState);

            // Get history array if it exists
            List<string> history = GetHistory(turnState);

            // Populate up to max chars
            int textTokens = 0;
            List<string> lines = new();
            for (int i = history.Count - 1; i >= 0; i--)
            {
                // Ensure that adding line won't go over the max character length
                string line = history[i];
                int lineTokens = GPT3Tokenizer.Encode(line).Count;
                int newTextTokens = textTokens + lineTokens;
                if (newTextTokens > maxTokens)
                {
                    break;
                }

                // Prepend line to output
                textTokens = newTextTokens;
                lines.Insert(0, line);
            }

            return lines.ToArray();
        }

        /// <summary>
        /// Gets the conversation history from the turn state object.
        /// </summary>
        /// <param name="turnState">The application turn state</param>
        /// <returns>The conversation history</returns>
        public static List<string> GetHistory(ITurnState<StateBase, StateBase, TempState> turnState)
        {
            if (turnState.Conversation != null && turnState.Conversation.TryGetValue(StatePropertyName, out object history))
            {
                if (history is List<string> historyList)
                {
                    return historyList;
                }
            };

            return new List<string>();
        }


        private static void _VerifyConversationState(ITurnState<StateBase, StateBase, TempState> turnState)
        {
            if (turnState.Conversation == null)
            {
                throw new ArgumentException("The passed turn state object has a null `ConversationState` property");
            }
        }

        private static void _SetHistory(ITurnState<StateBase, StateBase, TempState> turnState, List<string> newHistory)
        {
            turnState.Conversation?.Set(StatePropertyName, newHistory);
        }
    }
}
