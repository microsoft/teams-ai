namespace QuestBot
{
    public static class ResponseGenerator
    {
        private static readonly string[] NO_QUESTS =
        {
            "You don't have any active quests.",
            "Your quest log is blank.",
            "You are without a quest currently.",
            "It appears you aren't on a quest.",
            "You're not on a quest."
        };

        private static readonly string[] ASK_QUEST =
        {
            " Ask around to find quests.",
            " Villagers and barkeeps are good sources of quests.",
            " Try asking if anyone has heard any rumors.",
            " You can always just say \"create a new quest\".",
            ""
        };

        private static readonly string[] MOVE_BLOCKED =
        {
            "As you begin heading towards your new destination a mysterious force transports back to your current location.",
            "As you take the first steps towards what lies ahead, a strange power brings you back to where you started.",
            "A mysterious source blocks your path to the next location and teleports you back to your where you're at.",
            "You begin making your way towards the new destination when an unexplainable force drags you back to your current location.",
            "Trust me. You are not ready to go there yet."
        };

        private static readonly string[] EMPTY_INVENTORY =
        {
            "It looks like you don't have any items on you.",
            "It appears your inventory is devoid of any items.",
            "Your inventory is completely empty.",
            "You don't appear to have anything on you.",
            "You have nothing in your pockets or in your bag."
        };

        private static readonly string[] EMPTY_DROPPED =
        {
            "You see nothing on the ground.",
            "A quick scan of the area reveals nothing at your feet.",
            "The immediate area is empty.",
            "There's nothing here you can take. ",
            "You can't see anything that can be picked up."
        };

        private static readonly string[] NOT_DROPPED =
        {
            "There isn't a {0} nearby.",
            "There isn't a {0} on the ground.",
            "Sorry, there's no {0} here.",
            "It appears that a {0} is nowhere to be seen.",
            "I'm sorry, but nothing like a {0} can be found."
        };

        private static readonly string[] NOT_IN_INVENTORY =
        {
            "You aren't carrying a {0}",
            "It doesn't look like you have a {0}.",
            "You can't seem to locate a {0} in your inventory.",
            "Unfortunately your inventory does not have a {0}.",
            "I'm sorry, you don't appear to have a {0} with you."
        };

        private static readonly string[] NOT_ENOUGH_ITEMS =
        {
            "You don't have enough {0}",
            "I'm sorry, you don't have enough {0} for that.",
            "You don't have enough {0} in your inventory.",
            "That won't work. You don't have enough {0} to make it happen.",
            "That's not going to work. You don't have enough {0}."
        };

        private static readonly string[] NOT_ENOUGH_GOLD =
        {
            "You take a deep breath as you count your golden coins. Only {0}. You're short!",
            "You check your bag of coins - only {0}! A disappointingly paltry sum.",
            "You empty your bag of coins, only to find {0} gold pieces. Far too few.",
            "You sift through your bag, barely any coins. {0}. That wouldn't buy hardly anything of value.",
            "With a sigh, you count the coins in your bag. Just {0} gold pieces, not enough."
        };

        private static readonly string[] NO_GOLD =
        {
            "As soon as you reach into your bag of gold coins, you can feel that something has gone seriously wrong; all your coins are gone! It looks like you've been robbed!",
            "You can barely believe your eyes - all the gold coins you had in your bag are gone! Could someone have stolen them?",
            "Your worst fears are realized when you open your bag of gold coins; empty :(",
            "You take out your bag of gold coins, only to find that it's empty!",
            "You search frantically for your bag of gold coins, but it's no where to be found."
        };

        private static readonly string[] DIRECTION_NOT_AVAILABLE_EXAMPLE =
        {
            "DM: You can't go {0}.\n",
            "DM: There's nothing to the {0}.\n",
            "DM: Travel to the {0} isn't possible.\n"
        };

        private static readonly string[] NOT_ALLOWED =
        {
            "You can't do that.",
            "That's not going to work here.",
            "Sorry... You try but it doesn't work.",
            "I can't allow you to do that.",
            "You tried but no dice."
        };

        private static readonly string[] DATA_ERROR =
        {
            "Uh oh, it looks like we've got a bit of a hiccup here. Let's try that again.",
            "Oopsie! That didn't quite go as planned. Let's give it another go.",
            "Oops... There was a glitch in the matrix. Let's try that again.",
            "Pardon the interruption! Let's reload and give this another attempt.",
            "Wow, that was unexpected! Let's do that one over."
        };

        private static readonly string[] UNKNOWN_ACTION =
        {
            "I'm sorry, I'm not sure how to {0}.",
            "I don't know the first thing about {0}.",
            "I'm not sure I'm the best person to help with {0}.",
            "I'm still learning about {0}, but I'll try my best.",
            "I'm afraid I'm not experienced enough with {0}."
        };

        public static string NoQuests() => string.Concat(GetRandomResponse(NO_QUESTS), GetRandomResponse(ASK_QUEST));

        public static string MoveBlocked() => GetRandomResponse(MOVE_BLOCKED);

        public static string EmptyInventory() => GetRandomResponse(EMPTY_INVENTORY);

        public static string EmptyDropped() => GetRandomResponse(EMPTY_DROPPED);

        public static string NotDropped(string name) => string.Format(GetRandomResponse(NOT_DROPPED), name);

        public static string NotInInventory(string name) => string.Format(GetRandomResponse(NOT_IN_INVENTORY), name);

        public static string NotEnoughItems(string name) => string.Format(GetRandomResponse(NOT_ENOUGH_ITEMS), name);

        public static string NotEnoughGold(int gold) =>
            gold > 0 ?
            string.Format(GetRandomResponse(NOT_ENOUGH_GOLD), gold) :
            GetRandomResponse(NO_GOLD);

        public static string DirectionNotAvailableExample(string direction) => string.Format
            (
                "Player: go {0}\n{1}",
                direction,
                string.Format(GetRandomResponse(DIRECTION_NOT_AVAILABLE_EXAMPLE), direction)
            );

        public static string NotAllowed() => GetRandomResponse(NOT_ALLOWED);

        public static string DataError() => GetRandomResponse(DATA_ERROR);

        public static string UnknownAction(string action) => string.Format(GetRandomResponse(UNKNOWN_ACTION), action);

        private static string GetRandomResponse(string[] responses) => responses[Random.Shared.Next(responses.Length)];
    }
}
