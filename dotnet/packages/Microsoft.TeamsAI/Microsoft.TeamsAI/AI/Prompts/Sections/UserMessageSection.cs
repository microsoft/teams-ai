using Microsoft.Teams.AI.AI.Models;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// A user message section.
    /// </summary>
    public class UserMessageSection : TemplateSection
    {
        /// <summary>
        /// Creates an instance of `UserMessageSection`
        /// </summary>
        /// <param name="template">Template to use for this section.</param>
        /// <param name="tokens">Sizing strategy for this section. Defaults to `auto`.</param>
        /// <param name="prefix">Prefix to use for user messages when rendering as text. Defaults to `user: `.</param>
        public UserMessageSection(string template, int tokens = -1, string prefix = "user: ") : base(template, ChatRole.User, tokens, true, "\n", prefix)
        {
        }
    }
}
