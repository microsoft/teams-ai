using Newtonsoft.Json.Schema;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace Microsoft.Teams.AI.Utilities
{
    public class ResponseJsonParsers
    {

        public static Dictionary<string, object> ParseAllObject(string text)
        {
            Dictionary<string, object> objects = new Dictionary<string, object>();
            string[] lines = text.Split('\n');

            foreach (string line in lines)
            {
                //TODO
            }
            return objects;
        }

        /// <summary>
        /// Fuzzy JSON parser.
        /// </summary>
        /// <param name="text">text to parse.</param>
        /// <returns>The parsed object or null if the object could not be parsed.</returns>
        public static Dictionary<string, object>? ParseJSON(string text)
        {
            int startBrace = text.IndexOf("{");
            if (startBrace >= 0)
            {
                string objText = text.Substring(startBrace);
                List<char> nesting = new() { '}' };
                string cleaned = "{";
                bool inString = false;
                for (int i = 1; i < objText.Length && nesting.Count() > 0; i++)
                {
                    char ch = objText[i];
                    if (inString)
                    {
                        cleaned += ch;
                        if (ch == '\\' && i < objText.Length - 1 && objText[i + 1] == '\\')
                        {
                            i += 2;
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
                    Dictionary<string, object>? obj = JsonSerializer.Deserialize<Dictionary<string, object>>(cleaned);
                    return obj.Count() > 0 ? obj : null;
                }
                catch (Exception)
                {
                    return null;
                }
            }
            else
            {
                return null;
            }
        }
    }
}
