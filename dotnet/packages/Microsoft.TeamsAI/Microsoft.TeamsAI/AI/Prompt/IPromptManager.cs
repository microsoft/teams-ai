using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Prompt
{
    /// <summary>
    /// Interface for a prompt manager.
    /// </summary>
    /// <typeparam name="TState">The turn state class.</typeparam>
    public interface IPromptManager<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <summary>
        /// Register prompt variables.
        /// </summary>
        /// <remarks>
        /// You will be able to reference these variables in the prompt template string by using this format: `{{ $key }}`.
        /// </remarks>
        IDictionary<string, string> Variables { get; }

        /// <summary>
        /// Adds a custom function <paramref name="name"/> to the prompt manager.
        /// </summary>
        /// <remarks>
        /// Functions can be used with a prompt template using a syntax of `{{name}}`. Functions
        /// arguments are not currently supported.
        /// </remarks>
        /// <param name="name">The name of the function.</param>
        /// <param name="promptFunction">Delegate to return on name match.</param>
        /// <param name="allowOverrides">Whether to allow overriding an existing function.</param>
        /// <returns>The prompt manager for chaining.</returns>
        IPromptManager<TState> AddFunction(string name, PromptFunction<TState> promptFunction, bool allowOverrides = false);

        /// <summary>
        /// Adds a prompt template to the prompt manager.
        /// </summary>
        /// <param name="name">Name of the prompt template.</param>
        /// <param name="promptTemplate">Prompt template to add.</param>
        /// <returns>The prompt manager for chaining.</returns>
        IPromptManager<TState> AddPromptTemplate(string name, PromptTemplate promptTemplate);

        /// <summary>
        /// Invokes a function by <paramref name="name"/>.
        /// </summary>
        /// <param name="turnContext">Current application turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="name">Name of the function to invoke.</param>
        /// <returns>The result returned by the function for insertion into a prompt.</returns>
        Task<string> InvokeFunction(ITurnContext turnContext, TState turnState, string name);

        /// <summary>
        /// Loads a named prompt template from the filesystem.
        /// </summary>
        /// <param name="name">Name of the template to load.</param>
        /// <returns>The loaded prompt template.</returns>
        PromptTemplate LoadPromptTemplate(string name);

        /// <summary>
        /// Renders a prompt template by name.
        /// </summary>
        /// <param name="turnContext">Current application turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="name">Name of prompt template.</param>
        /// <returns>The rendered prompt template</returns>
        Task<PromptTemplate> RenderPromptAsync(ITurnContext turnContext, TState turnState, string name);

        /// <summary>
        /// Renders a prompt template.
        /// </summary>
        /// <param name="turnContext">Current application turn context.</param>
        /// <param name="turnState">Current turn state.</param>
        /// <param name="promptTemplate">Prompt template to render.</param>
        /// <returns>The rendered prompt template</returns>
        Task<PromptTemplate> RenderPromptAsync(ITurnContext turnContext, TState turnState, PromptTemplate promptTemplate);
    }
}
