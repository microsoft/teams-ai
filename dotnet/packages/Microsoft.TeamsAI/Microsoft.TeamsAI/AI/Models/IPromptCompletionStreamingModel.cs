
namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// An AI model that can be used to complete streaming prompts.
    /// </summary>
    public interface IPromptCompletionStreamingModel : IPromptCompletionModel
    {
        /// <summary>
        /// Optional. Events emitted by the model.
        /// </summary>
        PromptCompletionModelEmitter? Events { get; set; }
    }
}
