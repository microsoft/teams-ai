
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Prompt
{
    /// <summary>
    /// A template for a prompt.
    /// </summary>
    public class PromptTemplate
    {
        /// <summary>
        /// The text of the prompt.
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// The configuration for the prompt.
        /// </summary>
        public PromptTemplateConfiguration Configuration { get; set; }

        /// <summary>
        /// Creates a new instance of the <see cref="PromptTemplate"/> class.
        /// </summary>
        /// <param name="text">The text of the prompt.</param>
        /// <param name="configuration">The configuration for the prompt.</param>
        public PromptTemplate(string text, PromptTemplateConfiguration configuration)
        {
            Verify.ParamNotNull(text);
            Verify.ParamNotNull(configuration);

            Text = text;
            Configuration = configuration;
        }
    }
}
