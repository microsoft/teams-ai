using AdaptiveCards;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365
{
    public class ResponseParser
    {
        /// <summary>
        /// Extract all the valid JSON strings within the input text and returns a list of objects.
        /// </summary>
        /// <param name="text">String that contains valid JSON object substrings</param>
        /// <returns>An ordered list of JSON objects</returns>
        public static List<JObject>? ParseJSON(string text)
        {
            int length = text.Length;

            if (length < 2) return null;

            var result = new List<JObject>();

            int startIndex;
            int endIndex = -1;
            while (endIndex < length)
            { 
                // Find the first "{"
                startIndex = text.IndexOf('{', endIndex + 1);
                if (startIndex == -1) return result;

                // Find the first "}" such that all the contents sandwiched between S & E is a valid JSON.
                endIndex = startIndex;
                while (endIndex < length)
                {
                    endIndex = text.IndexOf('}', endIndex + 1);
                    if (endIndex == -1) return result;

                    string possibleJSON = text.Substring(startIndex, endIndex - startIndex + 1);
                    
                    // Validate string to be a valid JSON
                    try
                    {
                        JToken.Parse(possibleJSON);
                    } catch (JsonReaderException)
                    {
                        continue;
                    }
                    
                    // Will deserialize string even if it's not a valid JSON
                    JObject? jsonObject = JsonConvert.DeserializeObject<JObject>(possibleJSON);

                    if (jsonObject != null)
                    {
                        result.Add(jsonObject);
                        break;
                    }
                }
            }

            return result;
        }
    }
}
