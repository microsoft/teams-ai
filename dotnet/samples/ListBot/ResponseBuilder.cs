namespace ListBot
{
    public static class ResponseBuilder
    {
        private static readonly Random RANDOM = new();

        private static readonly string[] GREET_MESSAGES =
        {
            "Welcome to List Bot! Type /reset to delete all existing lists.",
            "Hello! I'm List Bot. Use /reset to delete all your lists.",
            "Hi there! I'm here to help you manage your lists. Use /reset to delete all lists.",
            "Greetings! I'm List Bot. Type /reset to delete all your list.",
            "Hey there! List Bot here. You can use /reset to delete all lists."
        };

        private static readonly string[] RESET_MESSAGES =
        {
            "Resetting all lists. All lists have been deleted.",
            "Starting fresh. All lists have been reset.",
            "All lists have been cleared. Ready for new lists!",
            "Cleaning slate. All lists have been reset.",
            "All lists have been wiped. Ready for new lists!"
        };

        private static readonly string[] ITEM_NOT_FOUND_MESSAGES =
        {
            "I'm sorry, I couldn't locate a {0} on your {1} list.",
            "I don't see a {0} on your {1} list.",
            "It looks like you don't have a {0} on your {1} list.",
            "I'm sorry, I don't see a {0} on your {1} list.",
            "I couldn't find a {0} listed on your {1} list."
        };

        private static readonly string[] ITEM_FOUND_MESSAGES =
        {
            "I found {0} in your {1} list.",
            "It looks like {0} is in your {1} list.",
            "You have a {0} in your {1} list.",
            "The {0} was found in your {1} list.",
            "A {0} appears to be in your {1} list."
        };

        private readonly static string[] NO_LISTS_FOUND_MESSAGES =
        {
            "You don't have any lists yet.",
            "You haven't made any lists yet.",
            "It looks like you don't have any lists yet.",
            "No lists have been made yet.",
            "You don't have any lists set up yet."
        };

        private readonly static string[] UNKNOWN_ACTION_MESSAGES =
        {
            "I'm sorry, I'm not sure how to {0}.",
            "I don't know the first thing about {0}.",
            "I'm not sure I'm the best person to help with {0}.",
            "I'm still learning about {0}, but I'll try my best.",
            "I'm afraid I'm not experienced enough with {0}."
        };

        private readonly static string[] OFF_TOPIC_MESSAGES =
        {
            "I'm sorry, I'm not sure I can help you with that.",
            "I'm sorry, I'm afraid I'm not allowed to talk about such things.",
            "I'm sorry, I'm not sure I'm the right person to help you with that.",
            "I wish I could help you with that, but it's not something I can talk about.",
            "I'm sorry, I'm not allowed to discuss that topic."
        };

        public static string Greeting() => GetRandomResponse(GREET_MESSAGES);

        public static string Reset() => GetRandomResponse(RESET_MESSAGES);

        public static string ItemNotFound(string list, string item) => string.Format(GetRandomResponse(ITEM_NOT_FOUND_MESSAGES), item, list);

        public static string ItemFound(string list, string item) => string.Format(GetRandomResponse(ITEM_FOUND_MESSAGES), item, list);

        public static string NoListsFound() => GetRandomResponse(NO_LISTS_FOUND_MESSAGES);

        public static string UnknownAction(string action) => string.Format(GetRandomResponse(UNKNOWN_ACTION_MESSAGES), action);

        public static string OffTopic() => GetRandomResponse(OFF_TOPIC_MESSAGES);

        private static string GetRandomResponse(string[] responses)
        {
            int index = RANDOM.Next(responses.Length);
            return responses[index];
        }
    }
}
