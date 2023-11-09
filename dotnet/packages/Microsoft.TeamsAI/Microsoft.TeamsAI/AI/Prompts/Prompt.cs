using Microsoft.Teams.AI.AI.Prompts.Sections;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// Top level prompt section.
    ///
    /// Prompts are compositional such that they can be nested to create complex prompt hierarchies.
    /// </summary>
    public class Prompt : LayoutSection
    {
        /// <summary>
        /// Creates an instance of `Prompt`
        /// </summary>
        /// <param name="sections">sections to be rendered</param>
        /// <param name="tokens">Sizing strategy for this section. Defaults to `auto`</param>
        /// <param name="required">Indicates if this section is required. Defaults to `true`</param>
        /// <param name="separator">Separator to use between sections when rendering as text. Defaults to `\n\n`</param>
        public Prompt(List<PromptSection> sections, int tokens = -1, bool required = true, string separator = "\n\n") : base(sections, tokens, required, separator)
        {
        }

        /// <summary>
        /// Add Section
        /// </summary>
        /// <param name="section">section to add</param>
        public void AddSection(PromptSection section)
        {
            this.Sections.Add(section);
        }
    }
}
