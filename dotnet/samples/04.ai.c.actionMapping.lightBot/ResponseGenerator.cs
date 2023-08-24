namespace LightBot
{
    public static class ResponseGenerator
    {
        // Returns a friendly response for the light status
        public static string LightStatus(bool status)
        {
            var currently = status ? "on" : "off";
            var opposite = status ? "off" : "on";
            return
                GetRandomResponse(new string[]
                {
                    $"The lights are currently {currently}.",
                    $"It looks like the lights are {currently}.",
                    $"Right now the lights are {currently}.",
                    $"The lights are {currently} at the moment.",
                    $"They are {currently}."
                }) +
                GetRandomResponse(new string[]
                {
                    $" Would you like to switch them {opposite}?",
                    $" Should I turn them {opposite}?",
                    $" Can I flip them {opposite} for you?",
                    $" Would you like them {opposite}?",
                    ""
                });
        }

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
