"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import random


def pick_secret_word() -> str:
    """
    Returns a random secret word from a list of words.
    """
    words = [
        "Apple",
        "Banana",
        "Airplane",
        "Coffee",
        "Book",
        "Ocean",
        "Bird",
        "Elephant",
        "Moon",
        "Camel",
        "Television",
        "Cat",
        "Mountain",
        "Car",
        "Desert",
        "Pencil",
        "Peacock",
        "Building",
        "Alligator",
        "Moonlight",
        "Clock",
        "Lion",
        "Volcano",
        "Giraffe",
        "Sunshine",
        "Tree",
        "River",
        "Horse",
        "Butterfly",
        "Stadium",
        "Frog",
        "Cheetah",
        "Castle",
        "Crocodile",
        "Island",
        "Swimming Pool",
        "Wolf",
        "Plane",
        "Beach",
        "Beaver",
        "Bridge",
        "Balloon",
        "Diamond",
        "Cheese",
        "Train",
        "Dog",
        "Beetle",
        "Candy",
        "Swan",
        "House",
        "Tiger",
        "Hippo",
        "Tank",
        "Owl",
        "Shark",
        "Key",
        "Gorilla",
        "Fighter Jet",
        "Printer",
        "Dragon",
        "Snake",
        "Submarine",
        "Stars",
        "Hummingbird",
        "Pumpkin",
        "Lighthouse",
        "Telescope",
        "Boat",
        "Spider",
        "Cake",
        "Cave",
        "Garden",
        "Subway",
        "Deer",
        "Skyscraper",
        "Jaguar",
        "Whale",
        "Motorcycle",
        "Desk",
        "Ostrich",
        "Fox",
        "Bicycle",
        "Panda",
        "Couch",
        "Ladybug",
        "Fire Truck",
        "Ant",
        "Tortoise",
        "Robot",
        "Rocket",
        "Bison",
        "Guitar",
        "Comet",
        "Train Station",
        "Pen",
        "Pig",
        "Geyser",
        "Ship",
        "Scorpion",
        "Lobster",
        "Satellite",
        "Coral Reef",
        "Jellyfish",
        "Pigeon",
        "Racoon",
        "Umbrella",
        "Octopus",
        "Lamb",
        "Store",
        "Chipmunk",
        "Fountain",
        "Porcupine",
        "Seagull",
        "Bear",
        "Hedgehog",
        "Chessboard",
        "Coastline",
        "Puppet",
        "Flower",
        "Bull",
        "Computer",
        "Tesla",
        "Sloth",
        "Ice Cream",
        "Rattlesnake",
        "Honeybee",
        "Yacht",
        "Boogeyman",
        "Ferris Wheel",
        "Goblin",
        "Rhino",
        "Fairy",
        "Roller Coaster",
        "Toucan",
        "Rainbow",
        "Rock",
        "Phone",
        "Triangle",
        "Swamp",
        "Housefly",
        "Table",
        "Hamster",
        "Salmon",
        "Zebra",
        "Carrot",
        "Cobra",
        "Bush",
        "Lamp",
        "Banana Split",
        "Coffee Pot",
        "Homeless Man",
        "Monkey",
        "Compass",
        "Hedge Maze",
        "Unicorn",
        "Beehive",
        "Goldfish",
        "Caterpillar",
        "Matches",
        "Skateboard",
        "Big Ben",
        "Vacuum",
        "Buffalo",
        "Goose",
        "UFO",
        "Peacock Feather",
        "Squirrel",
        "Kangaroo",
        "Soccer Ball",
        "Lawn Mower",
        "Polaroid Camera",
        "Bowling Alley",
        "Flashlight",
        "Pirate Ship",
        "Microsoft",
        "Fly",
        "Ferret",
        "Gardner",
        "Lava Lamp",
        "Cathedral",
        "Priest",
        "Wizard",
        "Lizard",
        "Chef",
        "Gnome",
        "Witch",
        "Bat",
        "Meteor",
        "Honey Pot",
        "Kite",
        "Pistol",
        "Dolphin",
        "Doctor",
        "Helicopter",
        "Bumblebee",
        "Tuna",
        "Boxer",
        "Superhero",
        "Party Hat",
        "Piano",
        "Penguin",
        "Fire Hydrant",
        "Leprechaun",
        "Cherry",
        "Paris",
        "Mermaid",
        "Library",
        "Campfire",
        "Hockey",
        "Laser",
        "Grasshopper",
        "Volleyball",
        "Fish",
        "Rabbit",
        "Spider Web",
        "Skull",
        "Apple Pie",
        "Beans",
        "Teapot",
        "Museum",
        "Lemon",
        "Chair",
        "T-Rex",
        "Space Needle",
        "Tombstone",
        "Garbage Truck",
        "Tricycle",
        "Ray Gun",
        "Washington",
        "Anchor",
        "Football",
        "Lipstick",
        "Seattle",
        "Flamingo",
        "Mummy",
        "Black Hole",
        "Roam",
        "Fog",
        "Vampire",
        "Strawberry",
        "Angel",
        "Parachute",
        "Coliseum",
    ]
    return random.choice(words)


def get_random_response(responses):
    """
    Fetch from a list of possible responses and return a random string from the list.
    """
    return random.choice(responses)


def start_game():
    """
    Starts a game of 20 questions with the user and returns the initial response message.
    """
    return get_random_response(
        [
            "Ready to play? Let's play 20 questions, I have a secret word "
            + "or phrase in my mind, let's see if you can guess it!",
            "I'm picturing something in my head, guess it with 20 questions!",
            "Let's have a game of 20 questions - What's the secret word or "
            + "phrase I'm thinking of?",
            "Put your guessing skills to the test - Let's play 20 questions "
            + "and see if you can guess the secret word or phrase!",
            "Can you guess my secret word or phrase with only 20 questions?",
        ]
    ) + get_random_response(
        ["Send /quit if you give up.", "Enter /quit to start over.", "Type /quit to end the game."]
    )


def quit_game(secret_word):
    """
    Returns a message indicating that the game has been quit, along with
    the outcome of the game if a secret word is involved.
    """
    if secret_word:
        return get_random_response(
            [
                "Giving up huh?",
                "I accept your surrender.",
                "Wave the white flag?",
                "Throwing in the towel?",
                "Calling it a day?",
            ]
        ) + you_lose(secret_word)

    return get_random_response(
        [
            "We haven't even start yet.",
            "OK??? I win.",
            "We haven't even begun.",
            "We're not playing the game yet.",
            "Quitters never win.",
        ]
    )


def block_secret_word():
    """
    Returns a response indicating that the secret word cannot be revealed.
    """
    responses = [
        "I'm sorry, I can't answer that.",
        "I wish I could provide an answer, but unfortunately I can't.",
        "I apologize, but I'm not able to answer your question.",
        "Unfortunately I can't answer to that.",
        "Sadly, I can't provide an answer for that.",
    ]
    return random.choice(responses)


def last_guess(response):
    """
    Prompts the user for their last chance at guessing.
    """
    last_chance_prompts = [
        "Last chance!",
        "One more guess left.",
        "One shot remaining.",
        "End of the line. Take your best guess.",
        "You've got one more try.",
    ]
    return response + random.choice(last_chance_prompts)


def you_win(secret_word):
    """
    Announces that the user correctly guessed the secret word.
    """
    responses = [
        f"Congratulations! The secret word was {secret_word}.",
        f"You guessed it! The word was {secret_word}.",
        f"You got it - {secret_word}.",
        f"You did it! The secret word was {secret_word}.",
        f"Bravo! The secret word was {secret_word}.",
    ]
    return get_random_response(responses)


def you_lose(secret_word):
    """
    Returns a message indicating that the user lost the game.
    """
    responses = [
        f"No more guesses left - the secret word was {secret_word}!",
        f"That was your last try - the secret word was {secret_word}!",
        f"Game Over - the answer was {secret_word}!",
        f"Sorry, you didn't guess it - the secret word was {secret_word}!",
        f"Oops! No more guesses - the secret word was {secret_word}!",
    ]
    return get_random_response(responses)
