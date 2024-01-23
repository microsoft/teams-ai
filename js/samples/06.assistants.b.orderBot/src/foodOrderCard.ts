import { Order } from './foodOrderViewSchema';

/**
 *
 * @param {Order} order Order to generate a card for.
 */
export function generateCardForOrder(order: Order) {
    const card: any = {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
            {
                type: 'TextBlock',
                text: 'Your Order Summary',
                weight: 'Bolder',
                size: 'Medium',
                wrap: true
            },
            {
                type: 'Container',
                items: [
                    {
                        type: 'TextBlock',
                        text: 'Items:',
                        weight: 'Bolder',
                        wrap: true
                    }
                ]
            }
        ]
    };

    for (const item of order.items) {
        switch (item.itemType) {
            case 'pizza': {
                const name = item.name ? item.name : 'Custom Pizza';
                card.body.push({
                    type: 'TextBlock',
                    text: `${name} - Size: ${item.size || 'large'}, Quantity: ${item.quantity || 1}`,
                    wrap: true
                });
                break;
            }
            case 'beer':
                card.body.push({
                    type: 'TextBlock',
                    text: `Beer - Kind: ${item.kind}, Quantity: ${item.quantity || 1}`,
                    wrap: true
                });
                break;
            case 'salad':
                card.body.push({
                    type: 'TextBlock',
                    text: `Salad - Style: ${item.style || 'Garden'}, Portion: ${item.portion || 'half'}, Quantity: ${
                        item.quantity || 1
                    }`,
                    wrap: true
                });
                break;
            case 'unknown':
                card.body.push({
                    type: 'TextBlock',
                    text: `Unknown Item: ${item.text}`,
                    wrap: true,
                    color: 'Attention'
                });
                break;
            default:
                break;
        }
    }

    return card;
}
