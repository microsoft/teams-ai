using AdaptiveCards;
using System.Text.Json;

namespace QuestBot
{
    /// <summary>
    /// Parser helper to parse JSON and Adaptive Card
    /// </summary>
    public static class ResponseParser
    {
        public static IList<string>? ParseJSON(string text)
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

        public static AdaptiveCardParseResult? ParseAdaptiveCard(string text)
        {
            try
            {
                string? firstJSON = ParseJSON(text)?.FirstOrDefault();
                if (!string.IsNullOrEmpty(firstJSON))
                {
                    return AdaptiveCard.FromJson(firstJSON);
                }
            }
            catch (InvalidOperationException)
            {
                // Not JSON or not a card
            }

            return null;
        }
    }
}
