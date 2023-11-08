using AdaptiveCards;
using Microsoft.Bot.Schema;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Contains utility methods for creating various types of <see cref="AdaptiveCardInvokeResponse"/>.
    /// </summary>
    public static class AdaptiveCardInvokeResponseFactory
    {
        /// <summary>
        /// Returns response with type "application/vnd.microsoft.card.adaptive".
        /// </summary>
        /// <param name="adaptiveCard">An Adaptive Card.</param>
        /// <returns>The response that includes an Adaptive Card that the client should display.</returns>
        public static AdaptiveCardInvokeResponse AdaptiveCard(AdaptiveCard adaptiveCard)
        {
            return new AdaptiveCardInvokeResponse
            {
                StatusCode = 200,
                Type = "application/vnd.microsoft.card.adaptive",
                Value = adaptiveCard
            };
        }

        /// <summary>
        /// Returns response with type "application/vnd.microsoft.activity.message".
        /// </summary>
        /// <param name="message">A message.</param>
        /// <returns>The response that includes a message that the client should display.</returns>
        public static AdaptiveCardInvokeResponse Message(string message)
        {
            return new AdaptiveCardInvokeResponse
            {
                StatusCode = 200,
                Type = "application/vnd.microsoft.activity.message",
                Value = message
            };
        }
    }
}
