using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// Prompt Function
    /// </summary>
    /// <param name="context">context</param>
    /// <param name="memory">memory</param>
    /// <param name="functions">functions</param>
    /// <param name="tokenizer">tokenizer</param>
    /// <param name="args">args</param>
    /// <returns></returns>
    public delegate Task<dynamic> PromptFunction<TArgs>(ITurnContext context, Memory.Memory memory, IPromptFunctions<TArgs> functions, ITokenizer tokenizer, TArgs args);

    /// <summary>
    /// Prompt Functions
    /// </summary>
    public interface IPromptFunctions<TArgs>
    {
        /// <summary>
        /// Check If Has Function
        /// </summary>
        /// <param name="name">function name</param>
        /// <returns>true if has function, otherwise false</returns>
        public bool HasFunction(string name);

        /// <summary>
        /// Get Function
        /// </summary>
        /// <param name="name">function name</param>
        /// <returns>the function if it exists, otherwise null</returns>
        public PromptFunction<TArgs>? GetFunction(string name);

        /// <summary>
        /// Add A Function
        /// </summary>
        /// <param name="name">function name</param>
        /// <param name="func">function arguments</param>
        public void AddFunction(string name, PromptFunction<TArgs> func);

        /// <summary>
        /// Invoke A Function
        /// </summary>
        /// <param name="name">function name</param>
        /// <param name="context">context</param>
        /// <param name="memory">memory</param>
        /// <param name="tokenizer">tokenizer</param>
        /// <param name="args">args</param>
        /// <returns></returns>
        public Task<dynamic?> InvokeFunctionAsync(string name, ITurnContext context, Memory.Memory memory, ITokenizer tokenizer, TArgs args);
    }
}
