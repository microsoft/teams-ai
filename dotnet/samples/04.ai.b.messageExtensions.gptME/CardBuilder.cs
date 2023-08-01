using AdaptiveCards;
using AdaptiveCards.Templating;
using Microsoft.Bot.Schema;
using Newtonsoft.Json;

namespace GPT
{
    public static class CardBuilder
    {
        private static readonly string EDIT_VIEW_FILE = Path.Combine(".", "Resources", "EditView.json");
        private static readonly string INITIAL_VIEW_FILE = Path.Combine(".", "Resources", "InitialView.json");
        private static readonly string POST_CARD_FILE = Path.Combine(".", "Resources", "PostCard.json");

        public static async Task<Attachment> NewEditViewAttachment(string post, bool previewMode, CancellationToken cancellationToken)
        {
            string cardTemplate = await File.ReadAllTextAsync(EDIT_VIEW_FILE, cancellationToken)!;
            string cardContent = new AdaptiveCardTemplate(cardTemplate).Expand(
                new {
                    post,
                    previewMode
                });
            return new Attachment
            {
                Content = JsonConvert.DeserializeObject(cardContent),
                ContentType = AdaptiveCard.ContentType
            };
        }

        public static async Task<Attachment> NewInitialViewAttachment(CancellationToken cancellationToken)
        {
            string cardContent = await File.ReadAllTextAsync(INITIAL_VIEW_FILE, cancellationToken)!;
            return new Attachment
            {
                Content = JsonConvert.DeserializeObject(cardContent),
                ContentType = AdaptiveCard.ContentType
            };
        }

        public static async Task<Attachment> NewPostCardAttachment(string post, CancellationToken cancellationToken)
        {
            string cardTemplate = await File.ReadAllTextAsync(POST_CARD_FILE, cancellationToken)!;
            string cardContent = new AdaptiveCardTemplate(cardTemplate).Expand(
                new
                {
                    post
                });
            return new Attachment
            {
                Content = JsonConvert.DeserializeObject(cardContent),
                ContentType = AdaptiveCard.ContentType
            };
        }
    }
}
