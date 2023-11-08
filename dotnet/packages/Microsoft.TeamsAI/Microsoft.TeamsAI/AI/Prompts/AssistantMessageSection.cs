using Azure.AI.OpenAI;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// An assistant message section.
    /// </summary>
    public class AssistantMessageSection : TemplateSection
    {
        /// <summary>
        /// Creates an instance of `AssistantMessageSection`
        /// </summary>
        /// <param name="template">Template to use for this section.</param>
        /// <param name="tokens">Sizing strategy for this section. Defaults to `auto`.</param>
        /// <param name="prefix">Prefix to use for user messages when rendering as text. Defaults to `user: `.</param>
        public AssistantMessageSection(string template, int tokens = -1, string prefix = "assistant: ") : base(template, ChatRole.Assistant, tokens, true, "\n", prefix)
        {
        }
    }
}
