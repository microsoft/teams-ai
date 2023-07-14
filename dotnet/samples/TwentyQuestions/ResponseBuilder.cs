namespace TwentyQuestions
{
    public static class ResponseBuilder
    {
        private static readonly Random RANDOM = new();

        private static readonly string[] SECRET_WORDS =
        {
            "Apple", " banana", "airplane", "coffee", "book", "ocean", "bird",
            "Elephant", "moon", "camel", "television", "cat", "mountain", "car",
            "desert", "Pencil", "peacock", "Building", "Alligator", "Moonlight",
            "Clock", "Lion", "Volcano", "Giraffe", "Sunshine", "Tree", "River",
            "Horse", "Butterfly", "Stadium", "Frog", "Cheetah", "Castle",
            "Crocodile", "Island", "Swimming Pool", "Wolf", "Plane", "Beach",
            "Beaver", "Bridge", "Balloon", "Diamond", "Cheese", "Train", "Dog",
            "Beetle", "Candy", "Swan", "House", "Tiger", "Hippo", "Tank", "Owl",
            "Shark", "Key", "Gorilla", "Fighter Jet", "Printer", "Dragon", "Snake",
            "Submarine", "Stars", "Hummingbird", "Pumpkin", "Lighthouse", "Telescope",
            "Boat", "Spider", "Cake", "Cave", "Garden", "Subway", "Deer",
            "Skyscraper", "Jaguar", "Whale", "Motorcycle", "Desk", "Ostrich", "Fox",
            "Bicycle", "Panda", "Couch","Ladybug", "Fire Truck", "Ant", "Tortoise",
            "Robot", "Rocket", "Bison", "Guitar", "Comet", "Train Station", "Pen",
            "Pig", "Geyser", "Ship", "Scorpion", "Lobster", "Satellite",
            "Coral Reef", "Jellyfish", "Pigeon", "Racoon", "Umbrella", "Octopus",
            "Lamb", "Store", "Chipmunk", "Fountain", "Porcupine", "Seagull",
            "Bear", "Hedgehog", "Chessboard", "Coastline", "Puppet", "Flower",
            "Bull", "Computer", "Tesla", "Sloth", "Ice Cream", "Rattlesnake",
            "Honeybee", "Yacht", "Boogeyman", "Ferris Wheel", "Goblin", "Rhino",
            "Fairy", "Roller Coaster", "Toucan", "Rainbow", "Rock", "Phone",
            "Triangle", "Swamp", "Housefly", "Table", "Hamster", "Salmon", "Zebra",
            "Carrot", "Cobra", "Bush", "Lamp", "Banana Split", "Coffee Pot",
            "Homeless Man", "Monkey", "Compass", "Hedge Maze", "Unicorn", "Beehive",
            "Goldfish", "Caterpillar", "Matches", "Skateboard", "Big Ben", "Vacuum",
            "Buffalo", "Goose", "UFO", "Peacock Feather", "Squirrel", "Kangaroo",
            "Soccer Ball", "Lawn Mower", "Polaroid Camera", "Bowling Alley",
            "Flashlight", "Pirate Ship", "Microsoft", "Fly", "Ferret", "Gardner",
            "Lava Lamp", "Cathedral", "Priest", "Wizard", "Lizard", "Chef",
            "Gnome", "Witch", "Bat", "Meteor", "Honey Pot", "Kite", "Pistol",
            "Dolphin", "Doctor", "Helicopter", "Bumblebee", "Tuna", "Boxer",
            "Superhero", "Party Hat", "Piano", "Penguin", "Fire Hydrant",
            "Leprechaun", "Cherry", "Paris", "Mermaid", "Library", "Campfire",
            "Hockey", "Laser", "Grasshopper", "Volleyball", "Fish", "Rabbit",
            "Spider Web", "Skull", "Apple Pie", "Beans", "Teapot", "Museum",
            "Lemon", "Chair", "T-Rex", "Space Needle", "Tombstone", "Garbage Truck",
            "Tricycle", "Ray Gun", "Washington", "Anchor", "Football","Lipstick",
            "Seattle", "Flamingo", "Mummy", "Black Hole", "Roam", "Fog",
            "Vampire", "Strawberry", "Angel", "Parachute", "Coliseum"
        };

        private static readonly string[] START_MESSAGES =
        {
            "Ready to play? Let's play 20 questions, I have a secret word or phrase in my mind, let's see if you can guess it!",
            "I'm picturing something in my head, guess it with 20 questions!",
            "Let's have a game of 20 questions - What's the secret word or phrase I'm thinking of?",
            "Put your guessing skills to the test - Let's play 20 questions and see if you can guess the secret word or phrase!",
            "Can you guess my secret word or phrase with only 20 questions?"
        };

        private static readonly string[] HELP_MESSAGES =
        {
            "Send /quit if you give up.",
            "Enter /quit to start over.",
            "Type /quit to end the game."
        };

        private static readonly string[] QUIT_MESSAGES =
        {
            "Giving up huh?",
            "I accept your surrender.",
            "Wave the white flag?",
            "Throwing in the towel?",
            "Calling it a day?"
        };

        private static readonly string[] NOT_STARTED_MESSAGES =
        {
            "We haven't even start yet.",
            "OK??? I win.",
            "We haven't even begun.",
            "We're not playing the game yet.",
            "Quitters never win."
        };

        private static readonly string[] BLOCK_MESSAGES =
        {
            "I'm sorry, I can't answer that.",
            "I wish I could provide an answer, but unfortunately I can't.",
            "I apologize, but I'm not able to answer your question.",
            "Unfortunately I can't answer to that.",
            "Sadly, I can't provide an answer for that."
        };

        private static readonly string[] LAST_GUESS_MESSAGES =
        {
            "Last chance!",
            "One more guess left.",
            "One shot remaining.",
            "End of the line. Take your best guess.",
            "You've got one more try."
        };

        private static readonly string[] WIN_MESSAGES =
        {
            "Congratulations! The secret word was {0}.",
            "You guessed it! The word was {0}.",
            "You got it - {0}.",
            "You did it! The secret word was {0}.",
            "Bravo! The secret word was {0}."
        };

        private static readonly string[] LOSE_MESSAGES =
        {
            "No more guesses left - the secret word was {0}!",
            "That was your last try - the secret word was {0}!",
            "Game Over - the answer was {0}!",
            "Sorry, you didn't guess it - the secret word was {0}!",
            "Oops! No more guesses - the secret word was {0}!"
        };

        public static string PickSecretWord() => GetRandomResponse(SECRET_WORDS);

        public static string StartGame() => string.Concat(GetRandomResponse(START_MESSAGES), " ", GetRandomResponse(HELP_MESSAGES));

        public static string QuitGame(string? secretWord)
        {
            if (string.IsNullOrEmpty(secretWord))
            {
                return GetRandomResponse(NOT_STARTED_MESSAGES);
            }
            else
            {
                return string.Concat(GetRandomResponse(QUIT_MESSAGES), " ", YouLose(secretWord));
            }
        }

        public static string BlockSecretWord() => GetRandomResponse(BLOCK_MESSAGES);

        public static string LastGuess(string response) => string.Concat(response, GetRandomResponse(LAST_GUESS_MESSAGES));

        public static string YouWin(string secretWord) => string.Format(GetRandomResponse(WIN_MESSAGES), secretWord);

        public static string YouLose(string secretWord) => string.Format(GetRandomResponse(LOSE_MESSAGES), secretWord);

        private static string GetRandomResponse(string[] responses)
        {
            int index = RANDOM.Next(responses.Length);
            return responses[index];
        }
    }
}
