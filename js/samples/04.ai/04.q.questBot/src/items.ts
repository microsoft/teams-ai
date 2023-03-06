import { parseNumber } from "./bot";
import { IItemList } from "./interfaces";

export function normalizeItemName(name: string|undefined, count: number = 1): { name: string, count: number } {
    let key = (name ?? '').trim().toLowerCase();
    if (mappings.hasOwnProperty(key)) {
        return mappings[key](count);
    } else {
        return mapTo(key, count);
    }
}

export function textToItemList(text?: string): IItemList {
    const items: IItemList = {};
    function addItem(name: string, count: number) {
        if (items.hasOwnProperty(name)) {
            items[name] = items[name] + count;
        } else {
            items[name] = count;
        }
    }

    // Parse text
    text = (text ?? '').trim();
    if (text) {
        let name = '';
        const parts = text.replace('\n', ',').split(',');
        parts.forEach(entry => {
            const pos = entry.lastIndexOf(':');
            if (pos >= 0) {
                // Add item to list
                name += entry.substring(0, pos);
                const count = parseNumber(entry.substring(pos + 1), 0);
                addItem(name.trim().toLowerCase(), count);

                // Next item
                name = ''; 
            } else {
                // Append to current name
                name += `,${entry}`;
            }
        });

        // Add dangling item
        if (name.trim().length > 0) {
            addItem(name.trim().toLowerCase(), 0);
        }
    }

    return items;
}

interface IMappings {
    [key: string]: (count: number) => { name: string, count: number };
}

const mappings: IMappings = {
    '<item>': c => mapTo('', 0),
    'symbol': c => mapTo('', 0),
    'symbols': c => mapTo('', 0),
    'strange symbol': c => mapTo('', 0),
    'strange symbols': c => mapTo('', 0),
    'item': c => mapTo('', 0),
    'coin': c => mapTo('gold', c),
    'coins': c => mapTo('gold', c * 10),
    'gold coins': c => mapTo('gold', c),
    'nuggets': c => mapTo('gold', c * 10)
}

function mapTo(name: string, count: number): { name: string, count: number } {
    return {name, count};
}