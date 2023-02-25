import { IQuest } from "../interfaces"


export const quests: IQuest[] = [
    {
        title: `The Dungeon of Shadow Falls: A Curse of Ancients`,
        backstory: `Long ago, in a forgotten age, an ancient evil was unleashed upon the land. The powerful entity cursed the surrounding area, transforming it into a dank and dangerous dungeon filled with powerful monsters and treacherous traps. Now, brave adventurers must venture into the depths of the Dungeon of Shadow Falls to rid the land of the curse and restore peace to the realm. Will you accept the challenge?`,
        locations: ['village', 'mountains', 'lake', 'forest', 'desert', 'river', 'swamp', 'valley', 'temple', 'cave', 'canyon', 'pyramids', 'oasis'],
        startLocation: 'village'
    },
    {
        title: `The Artifact of Shadow Falls`,
        backstory: `A powerful magical artifact lies hidden within the treacherous Valley of Shadow Falls. It is said to hold the key to great power and knowledge, but it has been guarded by an ancient guardian for centuries. A group of adventurers set off in search of the relic, but never returned. The villagers of Shadow Falls have asked the party to undertake a daring rescue mission and save the lost adventurers from their certain doom.`,
        locations: [],
        startLocation: ''
    }
];

/*
quest ideas:

what are 3 classic D&D scenario types?

1. Rescue Mission: The party is sent to rescue a person, item, or location from a dangerous enemy or environment. 

2. Dungeon Crawl: The party is sent to explore a dungeon or other underground location, usually for the purpose of retrieving a powerful artifact or defeating a powerful foe.

3. Investigation: The party is tasked with uncovering the truth behind a mystery or crime, often involving sleuthing and intelligence gathering.

Rescue Mission Scenarios: 
1. The party is sent to rescue a group of villagers from Shadow Falls who have been kidnapped by a band of bandits and taken to their hideout in the mountain range. 

2. The villagers of Shadow Falls have asked the party to rescue a group of adventurers who went off in search of a powerful magical artifact and never returned. They must venture into the hidden valley, brave the abandoned temple, and face a powerful guardian who guards the artifact.  

3. The party is sent to rescue a nobleman who has been taken hostage by an evil warlord in the oasis.

Dungeon Crawl Scenarios: 
1. The party is sent to clear out a nearby dungeon under Shadow Falls that has been overrun by monsters. They must explore the winding corridors, survive deadly traps, and defeat a powerful boss monster. 

2. The party is sent to explore a mysterious cave located deep in the forest, rumored to contain a magical item of great power.

3. The party is sent to explore an ancient pyramid located in the desert and recover a powerful weapon hidden within its depths.

Investigation Scenarios:
1. The party is tasked with uncovering the truth behind a series of mysterious disappearances in Shadow Falls, possibly involving dark magic or creatures from the underworld.

2. The villagers of Shadow Falls believe that a powerful entity is behind a series of unnatural events occurring in the area, including mysterious disappearances and strange beasts appearing in the night. The party is sent to investigate the source of these events and discover the truth behind them.

3. The party is tasked with uncovering the truth behind a mysterious cult operating in the canyon, and their potential connection to a powerful artifact.
*/