
namespace Microsoft.Bot.Builder.M365.AI.Prompt
{
    public class PromptTemplate
    {
        public string Name { get; set; }
        public string Text { get; set; }
        public PromptTemplateConfiguration Configuration { get; set; }

        public PromptTemplate(string name, string text, PromptTemplateConfiguration configuration)
        {
            Name = name;
            Text = text;
            Configuration = configuration;
        }
    }
}
