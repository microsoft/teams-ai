using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.AI.Planner;
using QuestBot.Models;
using QuestBot.State;
using System.Text.Json;

namespace QuestBot
{
    /// <summary>
    /// Activity and Turn handlers for TeamsQuestBot
    /// </summary>
    public class TeamsQuestBotHandlers
    {
        private readonly TeamsQuestBot _app;

        public TeamsQuestBotHandlers(TeamsQuestBot app)
        {
            _app = app;
        }

        public async Task<bool> OnBeforeTurnAsync(ITurnContext turnContext, QuestState turnState, CancellationToken cancellationToken)
        {
            if (!string.Equals(ActivityTypes.Message, turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Clear conversation state on version change
            if (turnState.Conversation!.Version != QuestConversationState.CONVERSATION_STATE_VERSION)
            {
                turnState.ConversationStateEntry!.Delete();
                turnState.Conversation!.Version = QuestConversationState.CONVERSATION_STATE_VERSION;
            }

            var conversation = turnState.Conversation!;
            var player = turnState.User!;
            var temp = turnState.Temp!;

            // Initialize player state
            if (string.IsNullOrEmpty(player.Name))
            {
                player.Name = (turnContext.Activity.From?.Name ?? string.Empty).Split(' ')[0];
                if (player.Name.Length == 0)
                {
                    player.Name = "Adventurer";
                }
            }

            if (string.IsNullOrEmpty(player.Backstory))
            {
                player.Backstory = QuestUserState.DEFAULT_BACKSTORY;
            }

            if (string.IsNullOrEmpty(player.Equipped))
            {
                player.Equipped = QuestUserState.DEFAULT_EQUIPPED;
            }

            if (player.Inventory == null)
            {
                player.Inventory = new ItemList
                {
                    { "map", 1 },
                    { "sword", 1 },
                    { "hatchet", 1 },
                    { "gold", 50 }
                };
            }

            // Add player to session
            if (conversation.Players != null)
            {
                if (!conversation.Players.Contains(player.Name))
                {
                    var newPlayers = new List<string>(conversation.Players);
                    newPlayers.Add(player.Name);
                    conversation.Players = newPlayers;
                }
            }
            else
            {
                conversation.Players = new List<string> { player.Name };
            }

            // Update message text to include players name
            // - This ensures their name is in the chat history
            var useHelpPrompt = string.Equals("help", turnContext.Activity.Text.Trim(), StringComparison.OrdinalIgnoreCase);
            turnContext.Activity.Text = $"[{player.Name}] {turnContext.Activity.Text}";

            // Are we just starting?
            var newDay = false;
            Campaign? campaign;
            Location? location;
            if (!conversation.Greeted)
            {
                newDay = true;
                conversation.Greeted = true;
                temp.Prompt = "Intro";

                // Create starting location
                var village = Map.ShadowFalls.Locations["village"];
                location = new()
                {
                    Title = village.Name,
                    Description = village.Details,
                    EncounterChance = village.EncounterChance
                };

                // Initialize conversation state
                conversation.Turn = 1;
                conversation.Location = location;
                conversation.LocationTurn = 1;
                conversation.Quests = new Dictionary<string, Quest>(StringComparer.OrdinalIgnoreCase);
                conversation.Story = "The story begins.";
                conversation.Day = (int)Math.Floor(Random.Shared.NextDouble() * 365) + 1;
                conversation.Time = (int)Math.Floor(Random.Shared.NextDouble() * 14) + 6; // Between 6am and 8pm
                conversation.NextEncounterTurn = 5 + (int)Math.Floor(Random.Shared.NextDouble() * 15);

                // Create campaign
                var response = await _app.AI.CompletePromptAsync(turnContext, turnState, "CreateCampaign", null, cancellationToken);
                if (string.IsNullOrEmpty(response))
                {
                    throw new Exception("Failed to create campaign");
                }
                var campaignString = ResponseParser.ParseJSON(response)?.FirstOrDefault();
                if (campaignString != null && (campaign = JsonSerializer.Deserialize<Campaign>(campaignString)) != null)
                {
                    conversation.Campaign = campaign;
                    await turnContext.SendActivityAsync($"🧙 <strong>{campaign.Title}</strong>", cancellationToken: cancellationToken);
                }
                else
                {
                    turnState.ConversationStateEntry!.Delete();
                    await turnContext.SendActivityAsync(ResponseGenerator.DataError(), cancellationToken: cancellationToken);
                    return false;
                }
            }
            else
            {
                campaign = conversation.Campaign;
                location = conversation.Location;
                temp.Prompt = "Prompt";

                // Increment game turn
                conversation.Turn += 1;
                conversation.LocationTurn += 1;

                // Pass time
                conversation.Time += 0.25;
                if (conversation.Time >= 24)
                {
                    newDay = true;
                    conversation.Time -= 24;
                    conversation.Day += 1;
                    if (conversation.Day > 365)
                    {
                        conversation.Day = 1;
                    }
                }
            }

            // Find next campaign objective
            var campaignFinished = false;
            CampaignObjective? nextObjective = null;
            if (campaign != null)
            {
                campaignFinished = true;
                foreach (var objective in campaign.Objectives)
                {
                    if (!objective.Completed)
                    {
                        // Ignore if the objective is already a quest
                        if (conversation.Quests == null || !conversation.Quests.ContainsKey(objective.Title))
                        {
                            nextObjective = objective;
                        }

                        campaignFinished = false;
                        break;
                    }
                }
            }

            // Is user asking for help
            var objectiveAdded = false;
            if (useHelpPrompt && !campaignFinished)
            {
                temp.Prompt = "Help";
            }
            else if (nextObjective != null && Random.Shared.NextDouble() < 0.2)
            {
                // Add campaign objective as a quest
                var newQuests =
                    conversation!.Quests == null ?
                    new Dictionary<string, Quest>(StringComparer.OrdinalIgnoreCase) :
                    new Dictionary<string, Quest>(conversation!.Quests, StringComparer.OrdinalIgnoreCase);
                newQuests.Add(nextObjective.Title, new Quest
                {
                    Title = nextObjective.Title,
                    Description = nextObjective.Description
                });
                conversation.Quests = newQuests;

                // Notify user of new quest
                objectiveAdded = true;
                await turnContext.SendActivityAsync(
                    $"✨ <strong>{nextObjective.Title}</strong><br>{string.Join("<br>", nextObjective.Description.Trim().Split('\n'))}",
                    cancellationToken: cancellationToken);
            }

            // Has a new day passed?
            if (newDay)
            {
                var season = Conditions.DescribeSeason(conversation.Day);
                conversation.Temperature = Conditions.GenerateTemperature(season);
                conversation.Weather = Conditions.GenerateWeather(season);
            }

            // Load temp variables for prompt use
            temp.PlayerAnswered = false;
            temp.PromptInstructions = "Answer the players query.";

            if (campaignFinished)
            {
                temp.PromptInstructions =
                    "The players have completed the campaign. Congratulate them and tell them they can continue adventuring or use \"/reset\" to start over with a new campaign.";
                conversation.Campaign = null;
            }
            else if (objectiveAdded)
            {
                temp.Prompt = "NewObjective";
                temp.ObjectiveTitle = nextObjective!.Title;
                _app.AI.Prompts.Variables["$objectiveTitle"] = temp.ObjectiveTitle;
            }
            else if (conversation.Turn >= conversation.NextEncounterTurn && location != null && Random.Shared.NextDouble() <= location.EncounterChance)
            {
                // Generate a random encounter
                temp.PromptInstructions = "An encounter occurred! Describe to the player the encounter.";
                conversation.NextEncounterTurn = conversation.Turn + (5 + (int)Math.Floor(Random.Shared.NextDouble() * 15));
            }

            _app.AI.Prompts.Variables["players"] = JsonSerializer.Serialize(conversation.Players ?? Array.Empty<string>());
            _app.AI.Prompts.Variables["story"] = conversation.Story ?? string.Empty;
            _app.AI.Prompts.Variables["promptInstructions"] = temp.PromptInstructions ?? string.Empty;

            return true;
        }

        public async Task<bool> OnAfterTurnAsync(ITurnContext turnContext, QuestState turnState, CancellationToken cancellationToken)
        {
            var lastSay = ConversationHistory.GetLastSay(turnState);
            if (!string.IsNullOrEmpty(lastSay))
            {
                // We have a dangling `DM: ` so remove it
                ConversationHistory.RemoveLastLine(turnState);

                // Reply with the current story if we haven't answered player
                if (!turnState.Temp!.PlayerAnswered)
                {
                    var story = turnState.Conversation!.Story;
                    if (!string.IsNullOrEmpty(story))
                    {
                        await turnContext.SendActivityAsync(story, cancellationToken: cancellationToken);
                    }
                }
            }

            return true;
        }

        public async Task OnMessageActivityAsync(ITurnContext turnContext, QuestState turnState, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            var userInput = turnContext.Activity.Text;

            if (string.Equals("/state", userInput, StringComparison.OrdinalIgnoreCase))
            {
                await turnContext.SendActivityAsync(JsonSerializer.Serialize(turnState), cancellationToken: cancellationToken);
            }
            else if (string.Equals("/reset-profile", userInput, StringComparison.OrdinalIgnoreCase)
                || string.Equals("/reset-user", userInput, StringComparison.OrdinalIgnoreCase))
            {
                turnState.UserStateEntry!.Delete();
                turnState.Conversation!.Players = Array.Empty<string>();
                await turnContext.SendActivityAsync("I've reset your profile.", cancellationToken: cancellationToken);
            }
            else if (string.Equals("/reset", userInput, StringComparison.OrdinalIgnoreCase))
            {
                turnState.ConversationStateEntry!.Delete();
                await turnContext.SendActivityAsync("Ok lets start this over.", cancellationToken: cancellationToken);
            }
            else if (string.Equals("/forget", userInput, StringComparison.OrdinalIgnoreCase))
            {
                ConversationHistory.Clear(turnState);
                await turnContext.SendActivityAsync("Ok forgot all conversation history.", cancellationToken: cancellationToken);
            }
            else if (string.Equals("/history", userInput, StringComparison.OrdinalIgnoreCase))
            {
                var history = ConversationHistory.ToString(turnState, 4000, "\n\n");
                await turnContext.SendActivityAsync($"<strong>Chat history:</strong><br>{history}", cancellationToken: cancellationToken);
            }
            else if (string.Equals("/story", userInput, StringComparison.OrdinalIgnoreCase))
            {
                await turnContext.SendActivityAsync($"<strong>The story so far:</strong><br>{turnState.Conversation!.Story ?? string.Empty}", cancellationToken: cancellationToken);
            }
            else if (string.Equals("/profile", userInput, StringComparison.OrdinalIgnoreCase))
            {
                var name = turnState.User!.Name;
                var backstory = string.Join("<br>", (turnState.User!.Backstory ?? string.Empty).Split('\n'));
                var equipped = string.Join("<br>", (turnState.User!.Equipped ?? string.Empty).Split('\n'));
                await turnContext.SendActivityAsync($"🤴 <strong>{name}</strong><br><strong>Backstory:</strong> {backstory}<br><strong>Equipped:</strong> {equipped}", cancellationToken: cancellationToken);
            }
            else
            {
                var prompt = turnState.Temp!.Prompt;
                await _app.AI.ChainAsync(turnContext, turnState, prompt, cancellationToken: cancellationToken);
            }
        }
    }
}
