namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Options for TestTurnState class.
    /// </summary>
    public class TestTurnStateOptions
    {
        /// <summary>
        /// The test user scope.
        /// </summary>
        public Record? User { get; set; }

        /// <summary>
        /// The test conversation scope.
        /// </summary>
        public Record? Conversation { get; set; }

        /// <summary>
        /// The test temp scope.
        /// </summary>
        public TempState? Temp { get; set; }
    }
}
