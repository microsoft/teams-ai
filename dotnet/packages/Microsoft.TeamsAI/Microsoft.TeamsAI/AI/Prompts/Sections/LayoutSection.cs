using Microsoft.Teams.AI.AI.Models;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// Base layout section that renders a set of `auto`, `fixed` or `proportional` length sections.
    /// </summary>
    public class LayoutSection : PromptSection
    {
        /// <summary>
        /// Sections To Be Rendered
        /// </summary>
        public readonly List<PromptSection> Sections;

        private List<PromptSection> _fixedSections
        {
            get
            {
                return this.Sections.Where(s => s.Tokens < 0 || s.Tokens > 1).OrderBy(s => s.Required).ToList();
            }
        }

        private List<PromptSection> _autoSections
        {
            get
            {
                return this.Sections.Where(s => s.Tokens >= 0 || s.Tokens <= 1).OrderBy(s => s.Required).ToList();
            }
        }

        /// <summary>
        /// Creates an instance of `LayoutSection`
        /// </summary>
        /// <param name="sections">sections to be rendered</param>
        /// <param name="tokens">tokens</param>
        /// <param name="required">required</param>
        /// <param name="separator">separator</param>
        /// <param name="prefix">prefix</param>
        public LayoutSection(List<PromptSection> sections, int tokens = -1, bool required = false, string separator = "\n", string prefix = "") : base(tokens, required, separator, prefix)
        {
            this.Sections = sections;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<string>> RenderAsTextAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            int length = 0;
            List<RenderedPromptSection<string>> renderedSections = new();


            // render fixed size
            foreach (PromptSection section in this._fixedSections)
            {
                RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context, memory, functions, tokenizer, maxTokens);

                if (length + rendered.Length >= maxTokens && !section.Required)
                {
                    break;
                }

                renderedSections.Add(rendered);
                length += rendered.Length;
            }

            // render auto size
            foreach (PromptSection section in this._autoSections)
            {
                RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context, memory, functions, tokenizer, maxTokens);

                if (length + rendered.Length >= maxTokens && !section.Required)
                {
                    break;
                }

                renderedSections.Add(rendered);
                length += rendered.Length;
            }

            List<string> output = renderedSections.Select(r => r.Output).ToList();
            string text = string.Join(this.Separator, output);

            return new(text, length, length > maxTokens);
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, Memory.Memory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens)
        {
            int length = 0;
            List<RenderedPromptSection<List<ChatMessage>>> renderedSections = new();


            // render fixed size
            foreach (PromptSection section in this._fixedSections)
            {
                RenderedPromptSection<List<ChatMessage>> rendered = await section.RenderAsMessagesAsync(context, memory, functions, tokenizer, maxTokens);

                if (length + rendered.Length >= maxTokens && !section.Required)
                {
                    break;
                }

                renderedSections.Add(rendered);
                length += rendered.Length;
            }

            // render auto size
            foreach (PromptSection section in this._autoSections)
            {
                RenderedPromptSection<List<ChatMessage>> rendered = await section.RenderAsMessagesAsync(context, memory, functions, tokenizer, maxTokens);

                if (length + rendered.Length >= maxTokens && !section.Required)
                {
                    break;
                }

                renderedSections.Add(rendered);
                length += rendered.Length;
            }

            List<ChatMessage> output = new();

            foreach (RenderedPromptSection<List<ChatMessage>> rendered in renderedSections)
            {
                output.AddRange(rendered.Output);
            }

            return new(output, length, length > maxTokens);
        }
    }
}
