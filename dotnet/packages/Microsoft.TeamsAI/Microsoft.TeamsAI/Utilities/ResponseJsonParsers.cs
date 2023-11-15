using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.Utilities
{
    /// <summary>
    /// LLM Response JSON Parsing Utilities
    /// </summary>
    public class ResponseJsonParsers
    {
        /// <summary>
        /// Parse all objects from a response string.
        /// </summary>
        /// <param name="text">Response text to parse.</param>
        /// <returns>Array of parsed objects.</returns>
        public static List<Dictionary<string, JsonElement>> ParseAllObjects(string text)
        {
            List<Dictionary<string, JsonElement>> objects = new();
            string[] lines = text.Split('\n');

            foreach (string line in lines)
            {
                Dictionary<string, JsonElement>? jsonObject = ParseJSON(line);

                if (jsonObject != null)
                {
                    objects.Add(jsonObject);
                }
            }

            if (objects.Count == 0)
            {
                Dictionary<string, JsonElement>? jsonObject = ParseJSON(text);

                if (jsonObject != null)
                {
                    objects.Add(jsonObject);
                }
            }

            return objects;
        }

        /// <summary>
        /// Fuzzy JSON parser.
        /// </summary>
        /// <param name="text">text to parse.</param>
        /// <returns>The parsed object or null if the object could not be parsed.</returns>
        public static Dictionary<string, JsonElement>? ParseJSON(string text)
        {
            int startBrace = text.IndexOf("{");

            if (startBrace >= 0)
            {
                string objText = text.Substring(startBrace);
                List<char> nesting = new() { '}' };
                string cleaned = "{";
                bool inString = false;

                for (int i = 1; i < objText.Length && nesting.Count > 0; i++)
                {
                    char ch = objText[i];

                    if (inString)
                    {
                        cleaned += ch;

                        if (ch == '\\')
                        {
                            // skip escape chars
                            while (ch == '\\')
                            {
                                i++;
                                ch = objText[i];
                            }

                            if (i < objText.Length)
                            {
                                cleaned += objText[i];
                            }
                            else
                            {
                                return null;
                            }
                        }
                        else if (ch == '"')
                        {
                            inString = false;
                        }
                    }
                    else
                    {
                        bool addPreCh = false;
                        bool addPostCh = false;

                        switch (ch)
                        {
                            case '"':
                                inString = true;
                                break;
                            case '{':
                                nesting.Add('}');
                                break;
                            case '[':
                                nesting.Add(']');
                                break;
                            case '}':
                                char closeObject = nesting.Last();
                                nesting.RemoveAt(nesting.Count - 1);

                                if (closeObject != '}')
                                {
                                    return null;
                                }
                                break;
                            case ']':
                                char closeArray = nesting.Last();
                                nesting.RemoveAt(nesting.Count - 1);

                                if (closeArray != ']')
                                {
                                    return null;
                                }
                                break;
                            case '<':
                                addPreCh = true;
                                break;
                            case '>':
                                addPostCh = true;
                                break;
                        }

                        string chStr = ch.ToString();

                        cleaned += addPreCh ? ("\"" + chStr) : (addPostCh ? (chStr + "\"") : chStr);
                    }
                }

                if (nesting.Count > 0)
                {
                    nesting.Reverse();
                    cleaned += new string(nesting.ToArray());
                }

                try
                {
                    Dictionary<string, JsonElement>? obj = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(cleaned, new JsonSerializerOptions()
                    {
                        WriteIndented = true,
                        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                        NumberHandling = JsonNumberHandling.AllowReadingFromString
                    });

                    if (obj?.Count > 0)
                    {
                        return obj;
                    }
                }
                catch (Exception)
                {
                    return null;
                }
            }

            return null;
        }
    }
}
