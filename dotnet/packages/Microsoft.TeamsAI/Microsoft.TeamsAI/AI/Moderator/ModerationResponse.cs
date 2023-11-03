using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.Moderator
{
    /// <summary>
    /// The result from the OpenAI's moderation API call.
    /// </summary>
    public class ModerationResponse
    {
        /// <summary>
        /// The ID of the moderation request.
        /// </summary>
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// The OpenAI model used for the moderation request.
        /// </summary>
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// The list of moderation results.
        /// </summary>
        [JsonPropertyName("results")]
        public List<ModerationResult> Results { get; set; } = new List<ModerationResult>();
    }

    /// <summary>
    /// The result item from the OpenAI's moderation API call.
    /// </summary>
    public class ModerationResult
    {
        /// <summary>
        /// The OpenAI categories and whether they were flagged or not.
        /// </summary>
        [JsonPropertyName("categories")]
        public ModerationCategoriesFlagged? CategoriesFlagged { get; set; }

        /// <summary>
        /// Per category scores denoting model's confidence that input violates OpenAI's policy for the category.
        /// </summary>
        /// <remarks>
        /// Higher score means higher confidence that input violates the policy.
        /// </remarks>
        [JsonPropertyName("category_scores")]
        public ModerationCategoryScores? CategoryScores { get; set; }

        /// <summary>
        /// Whether the input was flagged or not.
        /// </summary>
        /// <remarks>
        /// True means content violates OpenAI's policy. Otherwise false.
        /// </remarks>
        [JsonPropertyName("flagged")]
        public bool Flagged { get; set; }
    }

    /// <summary>
    /// Per category scores denoting model's confidence that input violates OpenAI's policy for the category.
    /// </summary>
    /// <remarks>
    /// Higher score means higher confidence that input violates the policy.
    /// </remarks>
    public class ModerationCategoriesFlagged
    {
        /// <summary>
        /// Whether input violates OpenAI's policy for the "hate" category.
        /// </summary>
        /// <remarks>
        /// Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste. Hateful content aimed at non-protected groups (e.g., chess players) is not covered by this category.
        /// </remarks>
        [JsonPropertyName("hate")]
        public bool Hate { get; set; }

        /// <summary>
        /// Whether input violates OpenAI's policy for the "hate/threatening" category.
        /// </summary>
        /// <remarks>
        /// Hateful content that also includes violence or serious harm towards the targeted group.
        /// </remarks>
        [JsonPropertyName("hate/threatening")]
        public bool HateThreatening { get; set; }

        /// <summary>
        /// Whether input violates OpenAI's policy for the "self-harm" category.
        /// </summary>
        /// <remarks>
        /// Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders.
        /// </remarks>
        [JsonPropertyName("self-harm")]
        public bool SelfHarm { get; set; }

        /// <summary>
        /// Whether input violates OpenAI's policy for the "sexual" category.
        /// </summary>
        /// <remarks>
        /// Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness).
        /// </remarks>
        [JsonPropertyName("sexual")]
        public bool Sexual { get; set; }

        /// <summary>
        /// Whether input violates OpenAI's policy for the "sexual/minors" category.
        /// </summary>
        /// <remarks>
        /// Sexual content that includes an individual who is under 18 years old.
        /// </remarks>
        [JsonPropertyName("sexual/minors")]
        public bool SexualMinors { get; set; }

        /// <summary>
        /// Whether input violates OpenAI's policy for the "violence" category.
        /// </summary>
        /// <remarks>
        /// Content that promotes or glorifies violence or celebrates the suffering or humiliation of others.
        /// </remarks>
        [JsonPropertyName("violence")]
        public bool Violence { get; set; }

        /// <summary>
        /// Whether input violates OpenAI's policy for the "violence/graphic" category.
        /// </summary>
        /// <remarks>
        /// Violent content that depicts death, violence, or serious physical injury in extreme graphic detail.
        /// </remarks>
        [JsonPropertyName("violence/graphic")]
        public bool ViolenceGraphic { get; set; }
    }

    /// <summary>
    /// Per category scores denoting model's confidence that input violates OpenAI's policy for the category.
    /// </summary>
    /// <remarks>
    /// Higher score means higher confidence that input violates the policy.
    /// </remarks>
    public class ModerationCategoryScores
    {

        /// <summary>
        /// Model's confidence that the input violates the OpenAI's policy for the category. Higher score denotes greater confidence.
        /// </summary>
        /// <remarks>
        /// Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste. Hateful content aimed at non-protected groups (e.g., chess players) is not covered by this category.
        /// </remarks>
        [JsonPropertyName("hate")]
        public double Hate { get; set; }

        /// <summary>
        /// Model's confidence that the input violates the OpenAI's policy for the category. Higher score denotes greater confidence.
        /// </summary>
        /// <remarks>
        /// Hateful content that also includes violence or serious harm towards the targeted group.
        /// </remarks>
        [JsonPropertyName("hate/threatening")]
        public double HateThreatening { get; set; }

        /// <summary>
        /// Model's confidence that the input violates the OpenAI's policy for the category. Higher score denotes greater confidence.
        /// </summary>
        /// <remarks>
        /// Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders.
        /// </remarks>
        [JsonPropertyName("self-harm")]
        public double SelfHarm { get; set; }

        /// <summary>
        /// Model's confidence that the input violates the OpenAI's policy for the category. Higher score denotes greater confidence.
        /// </summary>
        /// <remarks>
        /// Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness).
        /// </remarks>
        [JsonPropertyName("sexual")]
        public double Sexual { get; set; }

        /// <summary>
        /// Model's confidence that the input violates the OpenAI's policy for the category. Higher score denotes greater confidence.
        /// </summary>
        /// <remarks>
        /// Sexual content that includes an individual who is under 18 years old.
        /// </remarks>
        [JsonPropertyName("sexual/minors")]
        public double SexualMinors { get; set; }

        /// <summary>
        /// Model's confidence that the input violates the OpenAI's policy for the category. Higher score denotes greater confidence.
        /// </summary>
        /// <remarks>
        /// Content that promotes or glorifies violence or celebrates the suffering or humiliation of others.
        /// </remarks>
        [JsonPropertyName("violence")]
        public double Violence { get; set; }

        /// <summary>
        /// Model's confidence that the input violates the OpenAI's policy for the category. Higher score denotes greater confidence.
        /// </summary>
        /// <remarks>
        /// Violent content that depicts death, violence, or serious physical injury in extreme graphic detail.
        /// </remarks>
        [JsonPropertyName("violence/graphic")]
        public double ViolenceGraphic { get; set; }
    }

}
