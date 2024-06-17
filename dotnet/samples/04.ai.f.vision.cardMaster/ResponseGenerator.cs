namespace CardGazer
{
    public static class ResponseGenerator
    {
        // Returns a friendly response for an unknown action
        public static string UnknownAction(string action)
        {
            return GetRandomResponse(new string[]
            {
                $"I'm sorry, I'm not sure how to {action}.",
                $"I don't know the first thing about {action}.",
                $"I'm not sure I'm the best person to help with {action}.",
                $"I'm still learning about {action}, but I'll try my best.",
                $"I'm afraid I'm not experienced enough with {action}."
            });
        }

        // Returns a random response from an array of responses
        private static string GetRandomResponse(string[] responses) =>
            responses[Random.Shared.Next(responses.Length)];
    }
}
