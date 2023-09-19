namespace QuestBot.Models
{
    public class MapLocation
    {
        public string Id { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Details { get; set; } = string.Empty;

        public string Prompt { get; set; } = string.Empty;

        public string MapPaths { get; set; } = string.Empty;

        public double EncounterChance { get; set; }

        public string? North { get; set; }

        public string? West { get; set; }

        public string? South { get; set; }

        public string? East { get; set; }

        public string? Up { get; set; }

        public string? Down { get; set; }
    }
}
