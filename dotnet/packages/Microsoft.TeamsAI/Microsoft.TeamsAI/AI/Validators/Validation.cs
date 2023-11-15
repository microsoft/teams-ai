namespace Microsoft.Teams.AI.AI.Validators
{
    /// <summary>
    /// Response returned by a `PromptResponseValidator`
    /// </summary>
    /// <typeparam name="TValue"></typeparam>
    public class Validation<TValue>
    {
        /// <summary>
        /// Whether the validation is valid.
        /// If this is `false` the `Feedback` property will be set, otherwise the `Value` property MAY be set.
        /// </summary>
        public bool Valid { get; set; }

        /// <summary>
        /// Optional. Repair instructions to send to the model.
        /// Should be set if the validation fails.
        /// </summary>
        public string? Feedback { get; set; }

        /// <summary>
        /// Optional. Replacement value to use for the response.
        /// Can be set if the validation succeeds. If set, the value will replace the responses `message.content` property.
        /// </summary>
        public TValue? Value { get; set; }
    }
}
