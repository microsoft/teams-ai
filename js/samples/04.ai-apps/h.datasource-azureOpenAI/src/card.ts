import { AdaptiveCard, PromptResponse } from '@microsoft/teams-ai';

/**
 * Create an adaptive card from a prompt response.
 * @param {PromptResponse<string>} response The prompt response to create the card from.
 * @returns {AdaptiveCard} The response card.
 */
export function createResponseCard(response: PromptResponse<string>): AdaptiveCard {
    const citationCards: any = [];
    response.message!.context!.citations.forEach((citation, i) => {
        citationCards.push({
            type: 'Action.ShowCard',
            title: `${i + 1}`,
            card: {
                type: 'AdaptiveCard',
                body: [
                    {
                        type: 'TextBlock',
                        text: citation.title,
                        fontType: 'Default',
                        weight: 'Bolder'
                    },
                    {
                        type: 'TextBlock',
                        text: citation.content,
                        wrap: true
                    }
                ]
            }
        });
    });

    const text = formatResponse(response.message!.content!);
    const card: AdaptiveCard = {
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                text: text,
                wrap: true
            },
            {
                type: 'TextBlock',
                text: 'Citations',
                wrap: true,
                fontType: 'Default',
                weight: 'Bolder'
            },
            {
                type: 'ActionSet',
                actions: citationCards
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.5'
    };

    return card;
}

/**
 * Convert citation tags `[docn]` to `[n]` where n is a number.
 * @param {string} text The text to format.
 * @returns {string} The formatted text.
 */
function formatResponse(text: string): string {
    return text.replace(/\[doc(\d)+\]/g, '**[$1]** ');
}
