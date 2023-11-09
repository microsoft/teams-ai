namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// Prompt Templates
    /// </summary>
    public interface IPromptTemplates
    {
        /// <summary>
        /// Check If Has Prompt Template
        /// </summary>
        /// <param name="name">prompt name</param>
        /// <returns>true if has prompt, otherwise false</returns>
        public bool HasPrompt(string name);

        /// <summary>
        /// Get Prompt Template
        /// </summary>
        /// <param name="name">function name</param>
        /// <returns>the prompt template</returns>
        public PromptTemplate GetPrompt(string name);

        /// <summary>
        /// Add A Prompt Template
        /// </summary>
        /// <param name="name">prompt name</param>
        /// <param name="prompt">prompt template to add</param>
        public void AddPrompt(string name, PromptTemplate prompt);
    }
}
