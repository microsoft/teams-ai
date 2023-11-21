using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// Model represents assistants state.
    /// </summary>
    public interface IAssistantsState
    {
        /// <summary>
        /// Get or set the thread ID.
        /// </summary>
        string? ThreadId { get; set; }

        /// <summary>
        /// Get or set the run ID.
        /// </summary>
        string? RunId { get; set; }

        /// <summary>
        /// Get or set the last message ID.
        /// </summary>
        string? LastMessageId { get; set; }

        /// <summary>
        /// Get or set whether need to submit tool outputs.
        /// </summary>
        bool SubmitToolOutputs { get; set; }

        /// <summary>
        /// Get or set the submit tool map.
        /// </summary>
        Dictionary<string, string> SubmitToolMap { get; set; }
    }

    /// <summary>
    /// The default implementation of <see cref="IAssistantsState"/>.
    /// </summary>
    public class AssistantsState : TurnState<Record, Record, TempState>, IAssistantsState
    {
        /// <summary>
        /// Get or set the thread ID.
        /// Stored in ConversationState with key "assistants_state_thread_id".
        /// </summary>
        public string? ThreadId
        {
            get => Conversation?.Get<string>("assistants_state_thread_id");
            set => Conversation?.Set("assistants_state_thread_id", value);
        }

        /// <summary>
        /// Get or set the run ID.
        /// Stored in ConversationState with key "assistants_state_run_id".
        /// </summary>
        public string? RunId
        {
            get => Conversation?.Get<string>("assistants_state_run_id");
            set => Conversation?.Set("assistants_state_run_id", value);
        }

        /// <summary>
        /// Get or set the last message ID.
        /// Stored in ConversationState with key "assistants_state_last_message_id".
        /// </summary>
        public string? LastMessageId
        {
            get => Conversation?.Get<string>("assistants_state_last_message_id");
            set => Conversation?.Set("assistants_state_last_message_id", value);
        }

        /// <summary>
        /// Get or set whether need to submit tool outputs.
        /// Stored in TempState with key "assistants_state_submit_tool_outputs".
        /// </summary>
        public bool SubmitToolOutputs
        {
            get => Temp?.Get<bool>("assistants_state_submit_tool_outputs") ?? false;
            set => Temp?.Set("assistants_state_submit_tool_outputs", value);
        }

        /// <summary>
        /// Get or set the submit tool map.
        /// Stored in TempState with key "assistants_state_submit_tool_map".
        /// </summary>
        public Dictionary<string, string> SubmitToolMap
        {
            get => Temp?.Get<Dictionary<string, string>>("assistants_state_submit_tool_map") ?? new Dictionary<string, string>();
            set => Temp?.Set("assistants_state_submit_tool_map", value);
        }
    }
}
