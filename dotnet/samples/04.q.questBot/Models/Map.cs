﻿namespace QuestBot.Models
{
    public class Map
    {
        public IReadOnlyDictionary<string, MapLocation> Locations { get; private set; } = new Dictionary<string, MapLocation>(StringComparer.OrdinalIgnoreCase);

        public IReadOnlyDictionary<string, string> Aliases { get; private set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        public static readonly Map ShadowFalls = new()
        {
            Locations = new Dictionary<string, MapLocation>(StringComparer.OrdinalIgnoreCase)
            {
                ["village"] = new MapLocation
                {
                    Id = "village",
                    Name = "Shadow Falls",
                    Description = "A bustling settlement of small homes and shops, the Village of Shadow Falls is a friendly and welcoming place.",
                    Details = "The small village of Shadow Falls is a bustling settlement filled with small homes, shops, and taverns. The streets are bustling with people going about their daily lives, and the smell of fresh baked goods and spices wafts through the air. At the center of town stands an old stone tower, its entrance guarded by two large stone statues. The villagers of Shadow Falls are friendly and always willing to help adventurers in need.",
                    EncounterChance = 0.05,
                    Prompt = "prompt.txt",
                    MapPaths = "village->S:forest\nvillage->W:lake->N:river\nvillage->E:desert\nvillage->N:mountains\nvillage->E:desert->N:canyon\nvillage->W:lake\nvillage->W:lake->N:river->E:swamp\nvillage->E:desert->E:oasis\nvillage->W:lake->N:river->N:valley\nvillage->W:lake->N:river->N:valley->E:temple\nvillage->S:forest->S:cave\nvillage->E:desert->S:pyramids",
                    North = "mountains",
                    West = "lake",
                    South = "forest",
                    East = "desert"
                },
                ["forest"] = new MapLocation
                {
                    Id = "forest",
                    Name = "Shadowwood Forest",
                    Description = "The ancient forest of Shadowwood is a sprawling wilderness full of tall trees and thick foliage.",
                    Details = "The ancient forest of Shadowwood is a sprawling wilderness full of tall trees and thick foliage. Wild animals roam free, and the occasional campfire or abandoned hut can be found scattered throughout the woods. The air is thick with the smell of pine, and the shadows of the trees seem to stretch on forever. There are rumors that the forest hides secrets and mysteries, but none who venture too deep ever return.",
                    EncounterChance = 0.4,
                    MapPaths = "forest->N:village\nforest->N:village->W:lake->N:river\nforest->N:village->E:desert\nforest->N:village->N:mountains\nforest->N:village->E:desert->N:canyon\nforest->N:village->W:lake\nforest->N:village->W:lake->N:river->E:swamp\nforest->N:village->E:desert->E:oasis\nforest->N:village->W:lake->N:river->N:valley\nforest->N:village->W:lake->N:river->N:valley->E:temple\nforest->S:cave\nforest->N:village->E:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    North = "village",
                    South = "cave"
                },
                ["river"] = new MapLocation
                {
                    Id = "river",
                    Name = "Shadow Falls River",
                    Description = "A winding and treacherous path, the Shadow Falls River is a source of food for the villagers and home to dangerous creatures.",
                    Details = "The river that runs through Shadow Falls is a winding and treacherous path. Its waters are swift and turbulent, and it is not uncommon for travelers to become lost in its depths. The river also serves as a source of food for the villagers, as its banks are often full of fish and other aquatic life. Logs are brought in from the nearby forests, and the river is fed by giant waterfalls cascading down from the mountains. It is said that dangerous creatures lurk beneath the surface, so it is best to keep your distance.",
                    EncounterChance = 0.2,
                    MapPaths = "river->S:lake\nriver->S:lake->E:village\nriver->S:lake->E:village->S:forest\nriver->S:lake->E:village->E:desert\nriver->S:lake->E:village->N:mountains\nriver->S:lake->E:village->E:desert->N:canyon\nriver->E:swamp\nriver->S:lake->E:village->E:desert->E:oasis\nriver->N:valley\nriver->N:valley->E:temple\nriver->S:lake->E:village->S:forest->S:cave\nriver->S:lake->E:village->E:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    North = "valley",
                    West = "swamp",
                    South = "lake",
                    East = "mountains"
                },
                ["desert"] = new MapLocation
                {
                    Id = "desert",
                    Name = "Desert of Shadows",
                    Description = "The Desert of Shadows is a vast and desolate wasteland, home to bandits and hidden secrets.",
                    Details = "The Desert of Shadows is a vast and desolate wasteland. The sun beats down relentlessly, and the sand is hot and dry. Cacti and other desert plants provide the only source of shade, and the occasional oasis provides respite from the heat. Bandits and other unsavory characters often lurk in the shadows, so it is best to travel in groups. Legends tell of hidden secrets and forgotten treasures buried deep in the Desert of Shadows, but none who venture too far ever return.characters often lurk in the shadows, so it is best to travel in groups.",
                    EncounterChance = 0.2,
                    MapPaths = "desert->W:village\ndesert->W:village->S:forest\ndesert->W:village->W:lake->N:river\ndesert->W:village->N:mountains\ndesert->N:canyon\ndesert->W:village->W:lake\ndesert->W:village->W:lake->N:river->E:swamp\ndesert->E:oasis\ndesert->W:village->W:lake->N:river->N:valley\ndesert->W:village->W:lake->N:river->N:valley->E:temple\ndesert->W:village->S:forest->S:cave\ndesert->S:pyramids",
                    Prompt = "prompt.txt",
                    North = "canyon",
                    West = "village",
                    South = "pyramids",
                    East = "oasis"
                },
                ["mountains"] = new MapLocation
                {
                    Id = "mountains",
                    Name = "Shadow Mountains",
                    Description = "The Shadow Mountains are a rugged and dangerous land, rumored to be home to dragons and other mythical creatures.",
                    Details = "The Shadow Mountains are a rugged and dangerous land. The peaks are high and steep, and the air is thin and cold. There are rumors of hidden caves and forgotten treasures, but none who venture too far into the Shadow Mountains ever return. It is said that dragons and other mythical creatures inhabit the highest peaks, so it is best to stay away.",
                    EncounterChance = 0.2,
                    MapPaths = "mountains->S:village\nmountains->W:river\nmountains->W:river->S:lake\nmountains->E:canyon->S:desert->E:oasis\nmountains->W:river->E:swamp\nmountains->W:river->N:valley\nmountains->W:river->N:valley->E:temple\nmountains->S:village->S:forest\nmountains->S:village->S:forest->S:cave\nmountains->E:canyon\nmountains->E:canyon->S:desert\nmountains->E:canyon->S:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    West = "river",
                    South = "village",
                    East = "canyon"
                },
                ["canyon"] = new MapLocation
                {
                    Id = "canyon",
                    Name = "Shadow Canyon",
                    Description = "Shadow Canyon is a deep and treacherous ravine, the walls are steep and jagged, and secrets are hidden within.",
                    Details = "Shadow Canyon is a deep and treacherous ravine. The walls are steep and jagged, and the only path is a narrow, winding path. The air is musty and damp, and the occasional screech of some unseen creature echoes through the canyon. Rumor has it that an ancient civilization once resided here, but no one knows what happened to them. It is said that secrets and mysteries are hidden within the depths of the Shadow Canyon, but none who venture too far ever return.",
                    EncounterChance = 0.3,
                    MapPaths = "canyon->S:desert\ncanyon->S:desert->W:village\ncanyon->S:desert->W:village->S:forest\ncanyon->S:desert->W:village->W:lake->N:river\ncanyon->W:mountains\ncanyon->S:desert->W:village->E:desert\ncanyon->S:desert->W:village->W:lake\ncanyon->S:desert->W:village->W:lake->N:river->E:swamp\ncanyon->S:desert->E:oasis\ncanyon->S:desert->W:village->W:lake->N:river->N:valley\ncanyon->S:desert->W:village->W:lake->N:river->N:valley->E:temple\ncanyon->S:desert->W:village->S:forest->S:cave\ncanyon->S:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    West = "mountains",
                    South = "desert"
                },
                ["lake"] = new MapLocation
                {
                    Id = "lake",
                    Name = "Shadow Falls Lake",
                    Description = "Shadow Falls Lake is a peaceful and serene body of water, home to a booming fishing and logging industry.",
                    Details = "Shadow Falls Lake is a peaceful and serene body of water. Its waters are crystal clear, and its shores are dotted with colorful wildflowers. A small village can be seen on the opposite shore, and the occasional boat can be seen floating by. The lake is a popular destination for those looking to relax and get away from it all, and is home to a bustling fishing and logging industry. Giant waterfalls cascade down from the nearby mountains, providing a beautiful backdrop to the lake.",
                    EncounterChance = 0.2,
                    MapPaths = "lake->E:village\nlake->E:village->S:forest\nlake->N:river\nlake->E:village->E:desert\nlake->E:village->N:mountains\nlake->E:village->E:desert->N:canyon\nlake->N:river->E:swamp\nlake->E:village->E:desert->E:oasis\nlake->N:river->N:valley\nlake->N:river->N:valley->E:temple\nlake->E:village->S:forest->S:cave\nlake->E:village->E:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    North = "river",
                    West = "swamp",
                    East = "village"
                },
                ["swamp"] = new MapLocation
                {
                    Id = "swamp",
                    Name = "Shadow Swamp",
                    Description = "Shadow Swamp is a murky and treacherous marsh, home to some of the most dangerous creatures in the region.",
                    Details = "Shadow Swamp is a murky and treacherous marsh. The ground is soft and squishy, and the air is thick with the smell of decay. Mosquitoes and other bugs buzz about, and the occasional gator can be seen lurking in the shadows. It is best to avoid the Shadow Swamp, as it is home to some of the most dangerous creatures in the region.",
                    EncounterChance = 0.3,
                    MapPaths = "swamp->W:river\nswamp->W:river->S:lake\nswamp->W:river->S:lake->E:village\nswamp->W:river->S:lake->E:village->S:forest\nswamp->W:river->S:lake->E:village->E:desert\nswamp->W:river->S:lake->E:village->N:mountains\nswamp->W:river->S:lake->E:village->E:desert->N:canyon\nswamp->W:river->S:lake->E:village->E:desert->E:oasis\nswamp->W:river->N:valley\nswamp->W:river->N:valley->E:temple\nswamp->W:river->S:lake->E:village->S:forest->S:cave\nswamp->W:river->S:lake->E:village->E:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    East = "river"
                },
                ["oasis"] = new MapLocation
                {
                    Id = "oasis",
                    Name = "Oasis of the Lost",
                    Description = "The Oasis of the Lost is a lush and vibrant paradise, full of exotic flowers and the sweet smell of coconut.",
                    Details = "The Oasis of the Lost is a lush and vibrant paradise. Palm trees line the shore, and the air is filled with the sweet smell of coconut. Colorful birds flit through the branches, and the waters are calm and inviting. Exotic flowers bloom in the warm rays of the sun, and the occasional frog can be heard croaking from the reeds. The oasis is a popular spot for adventurers looking to rest and recuperate before continuing their journey, and for villagers looking to cool off and escape the desert heat. However, the oasis holds secrets hidden in its depths, and those brave enough to venture into the Oasis of the Lost may find what they seek, but they do so at their own risk.",
                    EncounterChance = 0.1,
                    MapPaths = "oasis->W:desert->W:village->W:lake\noasis->W:desert->W:village\noasis->W:desert->W:village->W:river\noasis->W:desert->W:village->S:forest\noasis->W:desert->\noasis->W:desert->W:village->:mountains\noasis->W:desert->N:canyon\noasis->W:desert->W:village->W:river->E:swamp\noasis->W:desert->W:village->W:river->N:valley\noasis->W:desert->W:village->W:river->N:valley->E:temple\noasis->W:desert->W:village->S:forest->S:cave\noasis->W:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    West = "desert"
                },
                ["valley"] = new MapLocation
                {
                    Id = "valley",
                    Name = "Valley of the Anasazi",
                    Description = "The Valley of the Anasazi is a mysterious and uncharted land, home to the ruins of forgotten temples.",
                    Details = "The Valley of the Anasazi is a mysterious and uncharted land, home to the ruins of forgotten temples and the remains of ancient civilizations. Lost in the shadows of the valley are secrets kept hidden for centuries, guarded by ancient and powerful creatures. Those brave enough to venture into the Valley of the Anasazi may find what they seek, but they do so at their own risk. The nearby Anasazi Temple is a crumbling ruin, its walls covered in vines and ancient symbols, and its corridors filled with strange echoes and whispers. It is said that the Temple holds a secret, but none who venture too deep ever return.",
                    EncounterChance = 0.3,
                    MapPaths = "valley->S:river\nvalley->S:river->S:lake\nvalley->S:river->S:lake->E:village\nvalley->S:river->S:lake->E:village->S:forest\nvalley->S:river->S:lake->E:village->E:desert\nvalley->S:river->S:lake->E:village->N:mountains\nvalley->S:river->S:lake->E:village->E:desert->N:canyon\nvalley->S:river->S:lake->N:river->E:swamp\nvalley->S:river->S:lake->E:village->E:desert->E:oasis\nvalley->E:temple\nvalley->S:river->S:lake->E:village->S:forest->S:cave\nvalley->S:river->S:lake->E:village->E:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    South = "river",
                    East = "temple"
                },
                ["temple"] = new MapLocation
                {
                    Id = "temple",
                    Name = "Anasazi Temple",
                    Description = "The abandoned Anasazi Temple is a forgotten and crumbling ruin, its walls covered in vines and ancient symbols.",
                    Details = "The abandoned Anasazi Temple is a forgotten and crumbling ruin. Its walls are covered in vines, and the floor is littered with debris. Ancient symbols adorn the walls, and the air is heavy with an eerie presence. It is said that the Anasazi once inhabited this temple, and those brave enough to enter may find secrets kept hidden for centuries. But be warned, the tombs are guarded by ancient and powerful creatures, so it is best to proceed with caution.",
                    EncounterChance = 0.4,
                    MapPaths = "temple->W:valley\ntemple->W:valley->S:river\ntemple->W:valley->S:river->S:lake\ntemple->W:valley->S:river->S:lake->E:village\ntemple->W:valley->S:river->S:lake->E:village->S:forest\ntemple->W:valley->S:river->S:lake->E:village->E:desert\ntemple->W:valley->S:river->S:lake->E:village->N:mountains\ntemple->W:valley->S:river->S:lake->E:village->E:desert->N:canyon\ntemple->W:valley->S:river->S:lake->N:river->E:swamp\ntemple->W:valley->S:river->S:lake->E:village->E:desert->E:oasis\ntemple->W:valley->S:river->S:lake->E:village->S:forest->S:cave\ntemple->W:valley->S:river->S:lake->E:village->E:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    West = "valley"
                },
                ["cave"] = new MapLocation
                {
                    Id = "cave",
                    Name = "Cave of the Ancients",
                    Description = "The Cave of the Ancients is a hidden and treacherous place, filled with strange echoes and whispers.",
                    Details = "The Cave of the Ancients is a hidden and treacherous place, difficult to find and even harder to explore. Its walls are lined with ancient symbols and runes, and its corridors are filled with strange echoes and whispers. The air is thick with the smell of musty stone and the faintest hint of something ancient and powerful. It is said that the cave holds a secret, but none who venture too deep ever return. Those brave enough to venture into the depths of the Cave of the Ancients may find what they seek, but they do so at their own risk.",
                    EncounterChance = 0.5,
                    MapPaths = "cave->N:forest\ncave->N:forest->N:village\ncave->N:forest->N:village->W:lake->N:river\ncave->N:forest->N:village->E:desert\ncave->N:forest->N:village->N:mountains\ncave->N:forest->N:village->E:desert->N:canyon\ncave->N:forest->N:village->W:lake\ncave->N:forest->N:village->W:lake->N:river->E:swamp\ncave->N:forest->N:village->E:desert->E:oasis\ncave->N:forest->N:village->W:lake->N:river->N:valley\ncave->N:forest->N:village->W:lake->N:river->N:valley->E:temple\ncave->N:forest->N:village->E:desert->S:pyramids",
                    Prompt = "prompt.txt",
                    North = "forest"
                },
                ["pyramids"] = new MapLocation
                {
                    Id = "pyramids",
                    Name = "Pyramids of the Forgotten",
                    Description = "The ancient Pyramids of the Forgotten, built by the Anuket, are home to powerful magic, guarded by ancient and powerful creatures.",
                    Details = "The ancient Pyramids of the Forgotten, built by the Anuket, have stood the test of time for ages. Their walls are covered in hieroglyphs, and the air is heavy with the smell of incense. It is said that these pyramids are home to powerful magic, wielded by the Anuket, and that those brave enough to enter may find great rewards. But be warned, the tombs are guarded by ancient and powerful creatures, so it is best to proceed with caution.",
                    EncounterChance = 0.4,
                    MapPaths = "pyramids->N:desert\npyramids->N:desert->W:village\npyramids->N:desert->W:village->S:forest\npyramids->N:desert->W:village->W:lake->N:river\npyramids->N:desert->W:village->N:mountains\npyramids->N:desert->N:canyon\npyramids->N:desert->W:village->W:lake\npyramids->N:desert->W:village->W:lake->N:river->E:swamp\npyramids->N:desert->E:oasis\npyramids->N:desert->W:village->W:lake->N:river->N:valley\npyramids->N:desert->W:village->W:lake->N:river->N:valley->E:temple\npyramids->N:desert->W:village->S:forest->S:cave",
                    Prompt = "prompt.txt",
                    North = "desert"
                }
            },
            Aliases = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["shadow falls"] = "village",
                ["town"] = "village",
                ["city"] = "village",
                ["market"] = "village",
                ["shops"] = "village",
                ["home"] = "village",
                ["base"] = "village",
                ["shadowwood forest"] = "forest",
                ["shadow forest"] = "forest",
                ["shadow falls forest"] = "forest",
                ["woods"] = "forest",
                ["trees"] = "forest",
                ["shadow falls river"] = "river",
                ["shadow river"] = "river",
                ["rivers"] = "river",
                ["desert of shadows"] = "desert",
                ["shadow falls desert"] = "desert",
                ["shadow desert"] = "desert",
                ["shadow mountains"] = "mountains",
                ["shadow falls mountain"] = "mountains",
                ["mountain"] = "mountain",
                ["shadow canyon"] = "canyon",
                ["shadow falls canyon"] = "canyon",
                ["canyons"] = "canyon",
                ["shadow falls lake"] = "lake",
                ["shadow lake"] = "lake",
                ["lakes"] = "lake",
                ["shadow swamp"] = "swamp",
                ["shadow fallse swamp"] = "swamp",
                ["swamps"] = "swamp",
                ["oasis of the lost"] = "oasis",
                ["lost oasis"] = "oasis",
                ["valley of the anasazi"] = "valley",
                ["anasazi valley"] = "valley",
                ["shadow valley"] = "valley",
                ["shadow falls valley"] = "valley",
                ["anasazi temple"] = "temple",
                ["shadow temple"] = "temple",
                ["shadow falls temple"] = "temple",
                ["temples"] = "temple",
                ["cave of the ancients"] = "cave",
                ["shadow falls cave"] = "cave",
                ["shadow cave"] = "cave",
                ["hidden cave"] = "cave",
                ["caves"] = "cave",
                ["pyramids of the forgotten"] = "pyramids",
                ["forgotten pyramids"] = "pyramids",
                ["shadow pyramids"] = "pyramids",
                ["shadow pyramid"] = "pyramids",
                ["shadow falls pyramids"] = "pyramids",
                ["shadow falls pyramid"] = "pyramids",
                ["pyramid"] = "pyramids"
            }
        };

        /// <summary>
        /// Finds a map location by name.
        /// </summary>
        /// <param name="name">The name of the map location.</param>
        /// <returns>The map location, or null if not found.</returns>
        public static MapLocation? FindMapLocation(string name)
        {
            var key = name?.Trim()?.ToLowerInvariant();
            if (!string.IsNullOrEmpty(key))
            {
                if (key.StartsWith("the "))
                {
                    key = key.Substring("the ".Length);
                }

                if (ShadowFalls.Aliases.ContainsKey(key))
                {
                    key = ShadowFalls.Aliases[key];
                }

                ShadowFalls.Locations.TryGetValue(key, out var location);
                return location;
            }

            return null;
        }
    }
}
