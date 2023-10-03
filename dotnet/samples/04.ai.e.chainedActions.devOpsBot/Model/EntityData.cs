using Newtonsoft.Json;

namespace DevOpsBot.Model
{
    /// <summary>
    /// The strongly typed work item entity data
    /// </summary>
    public class EntityData
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("title")]
        public string? Title { get; set; }

        [JsonProperty("assignedTo")]
        public string? AssignedTo { get; set; }

        [JsonProperty("status")]
        public string? Status { get; set; }
    }
}
