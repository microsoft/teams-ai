using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI
{
    /// <summary>
    /// Options for configuring the AI system.
    /// </summary>
    /// <typeparam name="TState">The turn state class.</typeparam>
    public sealed class AIOptions<TState> where TState : ITurnState<StateBase, StateBase, TempState>
    {
        /// <summary>
        /// The planner to use for generating plans.
        /// </summary>
        public IPlanner<TState> Planner { get; set; }

        /// <summary>
        /// The moderator to use for moderating input passed to the model and the output
        /// returned by the model.
        /// </summary>
        /// <remarks>
        /// The default value is an instance of <see cref="DefaultModerator{TState}"/>
        /// </remarks>
        public IModerator<TState> Moderator { get; set; }

        /// <summary>
        /// Maximum number of actions to execute in a single turn.
        /// </summary>
        /// <remarks>
        /// The default value is 25.
        /// </remarks>
        public int MaxSteps { get; set; }

        /// <summary>
        /// Maximum amount of time to spend executing a single turn in milliseconds.
        /// </summary>
        /// <remarks>
        /// The default value is 300000 or 5 minutes.
        /// </remarks>
        public TimeSpan MaxTime { get; set; }

        /// <summary>
        /// If true, the AI system will allow the planner to loop.
        /// </summary>
        /// <remarks>
        /// The default value is `true`.
        /// 
        /// Looping is needed for augmentations like `functions` and `monologue` where the LLM needs to
        /// see the result of the last action that was performed. The AI system will attempt to autodetect
        /// if it needs to loop so you generally don't need to worry about this setting.
        ///
        /// If you're using an augmentation like `sequence` you can set this to `false` to guard against
        /// any accidental looping.
        /// </remarks>
        public bool AllowLooping { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="AIOptions{TState}"/> class.
        /// </summary>
        /// <param name="planner">The planner to use for generating plans.</param>
        /// <param name="moderator"> The moderator to use for moderating input passed to the model and the output</param>
        /// <param name="maxSteps">Maximum number of actions to execute in a single turn.</param>
        /// <param name="maxTime">Maximum amount of time to spend executing a single turn in milliseconds.</param>
        /// <param name="allowLooping">If true, the AI system will allow the planner to loop.</param>
        public AIOptions(IPlanner<TState> planner, IModerator<TState>? moderator = null, int maxSteps = 25, TimeSpan? maxTime = null, bool allowLooping = true)
        {
            Verify.ParamNotNull(planner);

            Planner = planner;
            Moderator = moderator ?? new DefaultModerator<TState>();
            MaxSteps = maxSteps;
            MaxTime = maxTime ?? TimeSpan.FromMilliseconds(300000);
            AllowLooping = allowLooping;
        }
    }
}
