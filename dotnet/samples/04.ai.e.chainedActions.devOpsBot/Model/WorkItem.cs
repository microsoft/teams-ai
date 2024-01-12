using System.Text.Json.Serialization;

namespace DevOpsBot.Model
{
    /// <summary>
    /// The strongly typed work item parameter data
    /// </summary>
    public class WorkItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("assignedTo")]
        public string? AssignedTo { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }
    }
}
