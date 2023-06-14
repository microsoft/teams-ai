
namespace Microsoft.Bot.Builder.M365.AI.Prompt
{
    public class PromptTemplate
    {
        public string Text { get; set; }
        public PromptTemplateConfiguration Configuration { get; set; }

        public PromptTemplate(string text, PromptTemplateConfiguration configuration)
        {
            Text = text;
            Configuration = configuration;
        }
    }
}
