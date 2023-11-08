using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// Prompt Functions
    /// </summary>
    public interface IPromptFunctions
    {
        /// <summary>
        /// Check If Has Function
        /// </summary>
        /// <param name="name">function name</param>
        /// <returns>true if has function, otherwise false</returns>
        public bool HasFunction(string name);

        /// <summary>
        /// Invoke A Function
        /// </summary>
        /// <param name="name">function name</param>
        /// <param name="context">context</param>
        /// <param name="memory">memory</param>
        /// <param name="tokenizer">tokenizer</param>
        /// <param name="args">args</param>
        /// <returns></returns>
        public dynamic InvokeFunction<TArgs>(string name, TurnContext context, Memory.Memory memory, ITokenizer tokenizer, TArgs args);
    }
}
