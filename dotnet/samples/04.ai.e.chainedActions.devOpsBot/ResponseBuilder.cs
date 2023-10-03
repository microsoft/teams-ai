namespace DevOpsBot
{
    public static class ResponseBuilder
    {
        private static readonly string[] GREETING_MESSAGES =
        {
            "Welcome to DevOps Bot! Type /reset to delete all existing work items.",
            "Hello! I'm DevOps Bot. Use /reset to delete all your work items.",
            "Hi there! I'm here to help you manage your work items. Use /reset to delete all work items.",
            "Greetings! I'm DevOps Bot. Type /reset to delete all your work items.",
            "Hey there! DevOps Bot here. You can use /reset to delete all work items."
        };

        private static readonly string[] RESET_MESSAGES =
        {
            "Resetting all work items. All work items have been deleted.",
            "Starting fresh. All work items have been reset.",
            "All work items have been cleared. Ready for new work item!",
            "Cleaning slate. All work items have been reset.",
            "All work items have been wiped. Ready for new work item!"
        };

        private static readonly string[] ITEM_NOT_FOUND_MESSAGES =
        {
            "I'm sorry, I couldn't locate a {0} in your {1} list.",
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

        private static readonly string[] NO_LIST_FOUND_MESSAGES =
        {
            "You don't have any work items created yet.",
            "It looks like you don't have any work items yet.",
            "No work items have been created yet.",
            "You don't have any work items created yet."
        };

        private static readonly string[] UNKNOWN_ACTION_MESSAGES =
        {
            "I'm sorry, I'm not sure how to {0}.",
            "I don't know the first thing about {0}.",
            "I'm not sure I'm the best person to help with {0}.",
            "I'm still learning about {0}, but I'll try my best.",
            "I'm afraid I'm not experienced enough with {0}."
        };

        private static readonly string[] OFF_TOPIC_MESSAGES =
        {
            "I'm sorry, I'm not sure I can help you with that.",
            "I'm sorry, I'm afraid I'm not allowed to talk about such things.",
            "I'm sorry, I'm not sure I'm the right person to help you with that.",
            "I wish I could help you with that, but it's not something I can talk about.",
            "I'm sorry, I'm not allowed to discuss that topic."
        };

        /// <summary>
        /// This method is used for greeting and return random response.
        /// </summary>
        public static string Greeting() => GetRandomResponse(GREETING_MESSAGES);

        /// <summary>
        /// This method is used to reset the work items and starting with freshly.
        /// </summary>
        public static string Reset() => GetRandomResponse(RESET_MESSAGES);

        /// <summary>
        /// This method return random response if the work item not found.
        /// </summary>
        public static string ItemNotFound(string list, string item) => string.Format(GetRandomResponse(ITEM_NOT_FOUND_MESSAGES), item, list);

        /// <summary>
        /// This method return random response if the work item found.
        /// </summary>
        public static string ItemFound(string list, string item) => string.Format(GetRandomResponse(ITEM_FOUND_MESSAGES), item, list);

        /// <summary>
        /// This method return random response no list found.
        /// </summary>
        public static string NoListFound() => GetRandomResponse(NO_LIST_FOUND_MESSAGES);

        /// <summary>
        /// This method return random response for any unknown action.
        /// </summary>
        public static string UnknownAction(string action) => string.Format(GetRandomResponse(UNKNOWN_ACTION_MESSAGES), action);

        /// <summary>
        /// This method return random response if the prompt is off the topic.
        /// </summary>
        public static string OffTopic() => GetRandomResponse(OFF_TOPIC_MESSAGES);

        private static string GetRandomResponse(string[] responses) =>
            responses[Random.Shared.Next(responses.Length)];
    }
}
