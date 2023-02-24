import { IAction, IMapLocation } from "./interfaces";
import * as responses from './responses';


export const baseDMActions: IAction[] = [
];

export const basePlayerActions: IAction[] = [
    {
        title: `Buy an item`,
        examples: [
            `Inventory: { "gold": 50 }`,
            `Player: I’ll buy the shield`,
            `DM: DO buyItem name=\`shield\` count=1 cost=25 THEN SAY Here you go.`,
            `Player: /buy shield for 25`,
            `DM: DO buyItem name=\`shield\` count=1 cost=25 THEN SAY Here's your shield.`
        ]
    },
    {
        title: `Sell an item`,
        examples: [
            `Inventory:{ "gold": 25, "shield": 1 }`,
            `Player: I’ll sell the shield`,
            `DM: DO sellItem name=\`shield\` count=1 cost=10 THEN SAY Ok here’s 10 gold.`,
            `Player: /sell shield for 10`,
            `DM: DO sellItem name=\`shield\` count=1 cost=10 THEN SAY A fine addition to my collection.`
        ]
    },
    {
        title: `Search for items`,
        examples: [
            `Player: search chest`,
            `DM: DO foundItem name=\`gold\` count=100 THEN DO findItem name=\`helmet+3\` count=1 THEN SAY You found a 100 gold pieces and a +3 magic helmet`,
            `Player: /found 100 gold`,
            `DM: DO foundItem name=\`gold\` count=100 THEN SAY 100 gold was added to your inventory.`
        ]
    },
    {
        title: 'Take items',
        examples: [
            `DM: You see a variety of weapons, armor, and trinkets. Do you want to take any of these items?`,
            `Player:take the armor`,
            `DM: DO takeItem name=\`armor\` count=1 THEN SAY You take the armor and add it to your inventory.`
        ]
    },
    {
        title: `Drop items`,
        examples: [
            `Inventory: { "shield": 1 }`,
            `Player: drop my shield`,
            `DM: DO dropItem name=\`shield\` count=1 THEN SAY You dropped your shield.`,
            `Inventory: { "gold": 50 }`,
            `Player: drop the sword`,
            `DM: You're not carrying a sword.`,
            `Player: /drop sword`,
            `DM: DO dropItem name=\`sword\` count=1 THEN SAY The sword hits the ground with a heavy thud.`
        ]
    },
    {
        title: `Pickup items`,
        examples: [
            `Dropped: { "shield": 1 }`,
            `Player: pickup my shield`,
            `DM: DO pickupItem name=\`shield\` count=1 THEN SAY You picked up the shield`,
            `Dropped: { "helmet": 1 }`,
            `Player: pickup the shield`,
            `DM: I’m sorry there’s no shield to pickup`,
            `Player: /pickup sword`,
            `DM: DO pickupItem name=\`sword\` count=1 THEN SAY You bend down to the ground and pickup the sword.`
        ]
    },
    {
        title: `Check inventory`,
        examples: [
            `Player: what am I carrying?`,
            `DM: DO listInventory`,
            `Player: do I have a shield?`,
            `DM: DO listInventory`,
            `Player: /list inventory`,
            `DM: DO listInventory`
        ]
    },
    {
        title: `Check ground`,
        examples: [
            `Player: what’s on the ground?`,
            `DM: DO listDropped`,
            `Player: did I just drop my shield?`,
            `DM: DO listDropped`,
            `Player:look around for stuff to pickup`,
            `DM: DO listDropped`,
            `Player: /list dropped`,
            `DM: DO listDropped`
        ]
    }
];

export function describeAction(action: IAction): string {
    return `${action.title}:\n${action.examples.join('\n')}\n`;
}

export function describeMoveAction(location: IMapLocation): string {
    let text = `Change locations:\n`;
    ['north', 'west', 'south', 'east', 'up', 'down'].forEach(direction => {
        if (location[direction]) {
            text += `Player: go ${direction}\nDM: DO move location="${location[direction]}"\n`
        } else {
            switch (direction) {
                case 'up':
                case 'down':
                    // No examples
                    break;
                default:
                    text += responses.directionNotAvailableExample(direction);
            }
        }
    });

    return text;
}