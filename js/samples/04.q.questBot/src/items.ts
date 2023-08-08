/* eslint-disable security/detect-object-injection */
import { parseNumber } from './bot';
import { IItemList } from './interfaces';

/**
 * Convert items to normalized types / units
 * @param {IItemList} items The items to normalize.
 * @returns {IItemList} The normalized items.
 */
export function normalizeItems(items: IItemList): IItemList {
    const normalized: IItemList = {};
    for (const key in items) {
        const { name, count } = normalizeItemName(key, items[key]);
        if (Object.prototype.hasOwnProperty.call(normalized, name)) {
            normalized[name] = normalized[name] + count;
        } else {
            normalized[name] = count;
        }
    }
    return normalized;
}

/**
 * Normalizes an item name and count.
 * @param {string} name The item name.
 * @param {number} [count] The item count.
 * @returns {{ name: string; count: number }} The normalized item name and count.
 */
export function normalizeItemName(name: string | undefined, count = 1): { name: string; count: number } {
    const key = (name ?? '').trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(mappings, key)) {
        return mappings[key](count);
    } else {
        return mapTo(key, count);
    }
}

/**
 * Converts a string of text to an item list.
 * @param {string} text The text to convert.
 * @returns {IItemList} The item list.
 */
export function textToItemList(text?: string): IItemList {
    const items: IItemList = {};

    /**
     * Adds an item to the item list.
     * @param {string} name The name of the item.
     * @param {number} count The count of the item.
     */
    function addItem(name: string, count: number) {
        if (Object.prototype.hasOwnProperty.call(items, name)) {
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
        parts.forEach((entry) => {
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

/**
 * Searches for an item in an item list.
 * @param {string} item The item to search for.
 * @param {IItemList} list The item list to search in.
 * @returns {string} The best match for the item in the item list.
 */
export function searchItemList(item: string, list: IItemList): string {
    if (Object.prototype.hasOwnProperty.call(list, item)) {
        return item;
    }

    // Search list
    let bestMatch = '';
    for (const key in list) {
        if (key.indexOf(item) >= 0) {
            if (!bestMatch || key.length < bestMatch.length) {
                bestMatch = key;
            }
        }
    }

    return bestMatch;
}

interface IMappings {
    [key: string]: (count: number) => { name: string; count: number };
}

const mappings: IMappings = {
    '<item>': (c) => mapTo('', 0),
    symbol: (c) => mapTo('', 0),
    symbols: (c) => mapTo('', 0),
    'strange symbol': (c) => mapTo('', 0),
    'strange symbols': (c) => mapTo('', 0),
    item: (c) => mapTo('', 0),
    coin: (c) => mapTo('gold', c),
    coins: (c) => mapTo('gold', c * 10),
    'gold coins': (c) => mapTo('gold', c),
    nuggets: (c) => mapTo('gold', c * 10),
    wealth: (c) => mapTo('gold', c)
};

/**
 * Maps an item name and count to an object.
 * @param {string} name The item name.
 * @param {number} count The item count.
 * @returns {{ name: string; count: number }} The mapped item name and count.
 */
function mapTo(name: string, count: number): { name: string; count: number } {
    return { name, count };
}
