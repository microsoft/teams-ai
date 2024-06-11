using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Application;

namespace Microsoft.Teams.AI.AI.Prompts.Sections
{
    /// <summary>
    /// The user input message section.
    /// </summary>
    public class UserInputMessageSection : PromptSection
    {
        private readonly string inputVariable;
        private readonly string filesVariable;

        /// <summary>
        /// Creates a UserInputMessageSection
        /// </summary>
        /// <param name="tokens">Number of tokens</param>
        /// <param name="inputVariable">Name of the input variable</param>
        /// <param name="filesVariable">Name of the files variable</param>
        public UserInputMessageSection(int tokens = -1, string inputVariable = "input", string filesVariable = "inputFiles") : base(tokens, true, "\n", "user: ")
        {
            this.inputVariable = inputVariable;
            this.filesVariable = filesVariable;
        }

        /// <inheritdoc />
        public override Task<RenderedPromptSection<List<ChatMessage>>> RenderAsMessagesAsync(ITurnContext context, IMemory memory, IPromptFunctions<List<string>> functions, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            // Get input text and images
            string inputText = memory.GetValue(this.inputVariable) as string ?? string.Empty;
            List<InputFile> inputFiles = memory.GetValue(this.filesVariable) as List<InputFile> ?? new();

            // Create message
            List<MessageContentParts> messageContents = new();
            ChatMessage message = new(ChatRole.User)
            {
                Content = messageContents
            };

            // Append text content part
            int length = 0;
            int budget = this.Tokens > 1 ? Math.Min(this.Tokens, maxTokens) : maxTokens;
            if (inputText.Length > 0)
            {
                IEnumerable<int> encoded = tokenizer.Encode(inputText);
                if (encoded.Count() <= budget)
                {
                    messageContents.Add(new TextContentPart { Text = inputText });
                    length += encoded.Count();
                    budget -= encoded.Count();
                }
                else
                {
                    messageContents.Add(new TextContentPart { Text = tokenizer.Decode(encoded.Take(budget)) });
                }
            }

            // Append image content parts
            IEnumerable<InputFile> images = inputFiles.Where((f) => f.ContentType.StartsWith("image/"));

            foreach (InputFile image in images)
            {
                // Check for budget to add image.
                // TODO: This accounts for low detail images but not high detail images.
                // Additional work is needed to accoutn for high detail images.
                if (budget < 85)
                {
                    break;
                }

                // Add image
                string url = $"data:{image.ContentType};base64,{Convert.ToBase64String(image.Content.ToArray())}";
                messageContents.Add(new ImageContentPart { ImageUrl = url });
                length += 85;
                budget -= 85;
            }

            List<ChatMessage> messages = new() { message };
            RenderedPromptSection<List<ChatMessage>> renderedSection = new(messages, length);

            // Return output
            return Task.FromResult(renderedSection);
        }

    }
}
