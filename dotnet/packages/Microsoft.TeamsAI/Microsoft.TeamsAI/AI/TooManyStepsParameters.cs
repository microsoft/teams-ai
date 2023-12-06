namespace Microsoft.Teams.AI.AI
{
    /// <summary>
    /// The parameters for TooManyStepsActionName.
    /// </summary>
    public class TooManyStepsParameters
    {
        /// <summary>
        /// Maximum number of actions to execute in a single turn.
        /// </summary>
        public int MaxSteps { get; set; }

        /// <summary>
        /// Maximum amount of time to spend executing a single turn in milliseconds.
        /// </summary>
        public TimeSpan MaxTime { get; set; }

        /// <summary>
        /// Time the AI system started running.
        /// </summary>
        public DateTime StartTime { get; set; }

        /// <summary>
        /// Number of steps that have been executed.
        /// </summary>
        public int StepCount { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="TooManyStepsParameters"/> class.
        /// </summary>
        /// <param name="maxSteps"></param>
        /// <param name="maxTime"></param>
        /// <param name="startTime"></param>
        /// <param name="stepCount"></param>
        public TooManyStepsParameters(int maxSteps, TimeSpan maxTime, DateTime startTime, int stepCount)
        {
            MaxSteps = maxSteps;
            MaxTime = maxTime;
            StartTime = startTime;
            StepCount = stepCount;
        }
    }
}
