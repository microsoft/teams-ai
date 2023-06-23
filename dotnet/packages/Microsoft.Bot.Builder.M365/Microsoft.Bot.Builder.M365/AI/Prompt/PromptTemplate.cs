
using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.AI.Prompt
{
    public class PromptTemplate
    {
        public string Text { get; set; }
        public PromptTemplateConfiguration Configuration { get; set; }

        public PromptTemplate(string text, PromptTemplateConfiguration configuration)
        {
            Verify.NotNull(text, nameof(text));
            Verify.NotNull(configuration, nameof(configuration));

            Text = text;
            Configuration = configuration;
        }
    }
}
