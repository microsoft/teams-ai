using Microsoft.Teams.AI.State;
using QuestBot.Models;

namespace QuestBot.State
{
    public class QuestConversationState : StateBase
    {
        public static readonly int CONVERSATION_STATE_VERSION = 1;

        private const string _versionKey = "versionKey";
        private const string _greetedKey = "greetedKey";
        private const string _turnKey = "turnKey";
        private const string _locationKey = "locationKey";
        private const string _locationTurnKey = "locationTurnKey";
        private const string _campaignKey = "campaignKey";
        private const string _questsKey = "questsKey";
        private const string _playersKey = "playersKey";
        private const string _timeKey = "timeKey";
        private const string _dayKey = "dayKey";
        private const string _temperatureKey = "temperatureKey";
        private const string _weatherKey = "weatherKey";
        private const string _storyKey = "storyKey";
        private const string _nextEncounterTurnKey = "nextEncounterTurnKey";

        public int Version
        {
            get => Get<int>(_versionKey);
            set => Set(_versionKey, value);
        }

        public bool Greeted
        {
            get => Get<bool>(_greetedKey);
            set => Set(_greetedKey, value);
        }

        public int Turn
        {
            get => Get<int>(_turnKey);
            set => Set(_turnKey, value);
        }

        public Location? Location
        {
            get => Get<Location>(_locationKey);
            set => Set(_locationKey, value);
        }

        public int LocationTurn
        {
            get => Get<int>(_locationTurnKey);
            set => Set(_locationTurnKey, value);
        }

        public Campaign? Campaign
        {
            get => Get<Campaign>(_campaignKey);
            set
            {
                if (value == null)
                {
                    Remove(_campaignKey);
                }
                else
                {
                    Set(_campaignKey, value);
                }
            }
        }

        public IReadOnlyDictionary<string, Quest>? Quests
        {
            get => Get<IReadOnlyDictionary<string, Quest>>(_questsKey);
            set => Set(_questsKey, value);
        }

        public IReadOnlyList<string>? Players
        {
            get => Get<IReadOnlyList<string>>(_playersKey);
            set => Set(_playersKey, value);
        }

        public double Time
        {
            get => Get<double>(_timeKey);
            set => Set(_timeKey, value);
        }

        public int Day
        {
            get => Get<int>(_dayKey);
            set => Set(_dayKey, value);
        }

        public string? Temperature
        {
            get => Get<string>(_temperatureKey);
            set => Set(_temperatureKey, value);
        }

        public string? Weather
        {
            get => Get<string>(_weatherKey);
            set => Set(_weatherKey, value);
        }

        public string? Story
        {
            get => Get<string>(_storyKey);
            set => Set(_storyKey, value);
        }

        public int NextEncounterTurn
        {
            get => Get<int>(_nextEncounterTurnKey);
            set => Set(_nextEncounterTurnKey, value);
        }
    }
}
