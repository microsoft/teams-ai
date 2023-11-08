using Azure.AI.OpenAI;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Tokenizers;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// Base layout section that renders a set of `auto`, `fixed` or `proportional` length sections.
    /// </summary>
    public class LayoutSection : PromptSection
    {
        /// <summary>
        /// Sections To Be Rendered
        /// </summary>
        public readonly List<PromptSection> sections;

        private List<PromptSection> _fixedSections
        {
            get
            {
                return this.sections.Where(s => s.tokens < 0 || s.tokens > 1).OrderBy(s => s.required).ToList();
            }
        }

        private List<PromptSection> _autoSections
        {
            get
            {
                return this.sections.Where(s => s.tokens >= 0 || s.tokens <= 1).OrderBy(s => s.required).ToList();
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
            this.sections = sections;
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<string>> RenderAsTextAsync(TurnContext context, Memory.Memory memory, IPromptFunctions functions, ITokenizer tokenizer, int maxTokens)
        {
            int length = 0;
            List<RenderedPromptSection<string>> renderedSections = new();


            // render fixed size
            foreach (PromptSection section in this._fixedSections)
            {
                RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context, memory, functions, tokenizer, maxTokens);

                if (length + rendered.length >= maxTokens && !section.required)
                {
                    break;
                }

                renderedSections.Add(rendered);
                length += rendered.length;
            }

            // render auto size
            foreach (PromptSection section in this._autoSections)
            {
                RenderedPromptSection<string> rendered = await section.RenderAsTextAsync(context, memory, functions, tokenizer, maxTokens);

                if (length + rendered.length >= maxTokens && !section.required)
                {
                    break;
                }

                renderedSections.Add(rendered);
                length += rendered.length;
            }

            List<string> output = renderedSections.Select(r => r.output).ToList();
            string text = string.Join(this.separator, output);

            return new(text, length, length > maxTokens);
        }

        /// <inheritdoc />
        public override async Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(TurnContext context, Memory.Memory memory, IPromptFunctions functions, ITokenizer tokenizer, int maxTokens)
        {
            int length = 0;
            List<RenderedPromptSection<List<ChatMessage>>> renderedSections = new();


            // render fixed size
            foreach (PromptSection section in this._fixedSections)
            {
                RenderedPromptSection<List<ChatMessage>> rendered = await section.RenderAsMessagesAsync(context, memory, functions, tokenizer, maxTokens);

                if (length + rendered.length >= maxTokens && !section.required)
                {
                    break;
                }

                renderedSections.Add(rendered);
                length += rendered.length;
            }

            // render auto size
            foreach (PromptSection section in this._autoSections)
            {
                RenderedPromptSection<List<ChatMessage>> rendered = await section.RenderAsMessagesAsync(context, memory, functions, tokenizer, maxTokens);

                if (length + rendered.length >= maxTokens && !section.required)
                {
                    break;
                }

                renderedSections.Add(rendered);
                length += rendered.length;
            }

            List<ChatMessage> output = new();

            foreach (RenderedPromptSection<List<ChatMessage>> rendered in renderedSections)
            {
                output.AddRange(rendered.output);
            }

            return new(output, length, length > maxTokens);
        }
    }
}
