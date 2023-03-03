
export function normalizeItemName(name: string|undefined, count: number = 1): { name: string, count: number } {
    let key = (name ?? '').trim().toLowerCase();
    if (mappings.hasOwnProperty(key)) {
        return mappings[key](count);
    } else {
        return mapTo(key, count);
    }
}

interface IMappings {
    [key: string]: (count: number) => { name: string, count: number };
}

const mappings: IMappings = {
    '<item>': c => mapTo('', 0),
    'item': c => mapTo('', 0),
    'coin': c => mapTo('gold', c),
    'coins': c => mapTo('gold', c * 10),
    'gold coins': c => mapTo('gold', c),
    'nuggets': c => mapTo('gold', c * 10),
}

function mapTo(name: string, count: number): { name: string, count: number } {
    return {name, count};
}