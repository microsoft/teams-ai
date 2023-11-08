using Azure.AI.OpenAI;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// A system message section.
    /// </summary>
    public class SystemMessageSection : TemplateSection
    {
        /// <summary>
        /// Creates an instance of `SystemMessageSection`
        /// </summary>
        /// <param name="template">Template to use for this section.</param>
        /// <param name="tokens">Sizing strategy for this section. Defaults to `auto`.</param>
        public SystemMessageSection(string template, int tokens = -1) : base(template, ChatRole.System, tokens, true, "\n", "")
        {
        }
    }
}
