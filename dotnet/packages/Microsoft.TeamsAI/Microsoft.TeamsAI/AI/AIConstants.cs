
namespace Microsoft.Teams.AI.AI
{
    /// <summary>
    /// The constants used by the AI system.
    /// </summary>
    public static class AIConstants
    {
        /// <summary>
        /// The type of command that will be used to plan an action.
        /// </summary>
        public const string Plan = "plan";

        /// <summary>
        /// The type of command that will be used to do an action.
        /// </summary>
        public const string DoCommand = "DO";

        /// <summary>
        /// The type of command that will be used to say something.
        /// </summary>
        public const string SayCommand = "SAY";

        /// <summary>
        /// An action that will be called anytime an unknown action is predicted by the planner.
        /// </summary>
        /// <remarks>
        /// The default behavior is to simply log an error to the console. The plan is allowed to
        /// continue execution by default.
        /// </remarks>
        public const string UnknownActionName = "___UnknownAction___";

        /// <summary>
        /// An action that will be called anytime an input is flagged by the moderator.
        /// </summary>
        /// <remarks>
        /// The default behavior is to simply log an error to the console. Override to send a custom
        /// message to the user.
        /// </remarks>
        public const string FlaggedInputActionName = "___FlaggedInput___";

        /// <summary>
        /// An action that will be called anytime an output is flagged by the moderator.
        /// </summary>
        /// <remarks>
        /// The default behavior is to simply log an error to the console. Override to send a custom
        /// message to the user.
        /// </remarks>
        public const string FlaggedOutputActionName = "___FlaggedOutput___";

        /// <summary>
        /// An action that will be called anytime the planner is rate limited.
        /// </summary>
        public const string RateLimitedActionName = "___RateLimited___";

        /// <summary>
        /// An action that will be called after the plan has been predicted by the planner and it has
        /// passed moderation.
        /// </summary>
        /// <remarks>
        /// Overriding this action lets you customize the decision to execute a plan separately from the
        /// moderator. The default behavior is to proceed with the plans execution only when a plan
        /// contains one or more commands. Returning false from this action can be used to prevent the plan
        /// from being executed.
        /// </remarks>
        public const string PlanReadyActionName = "___PlanReady___";

        /// <summary>
        /// An action that is called to DO an action.
        /// </summary>
        /// <remarks>
        /// The action system is used to do other actions. Overriding this action lets you customize the
        /// execution of an individual action. You can use it to log actions being used or to prevent
        /// certain actions from being executed based on policy.
        ///
        /// The default behavior is to simply execute the action handler passed in so you will need to
        /// perform that logic yourself should you override this action.
        /// </remarks>
        public const string DoCommandActionName = "___DO___";

        /// <summary>
        /// An action that is called to SAY something.
        /// </summary>
        /// <remarks>
        /// Overriding this action lets you customize the execution of the SAY command. You can use it
        /// to log the output being generated or to add support for sending certain types of output as
        /// message attachments.
        ///
        /// The default behavior attempts to look for an Adaptive Card in the output and if found sends
        /// it as an attachment. If no Adaptive Card is found then the output is sent as a plain text
        /// message.
        ///
        /// If you override this action and want to automatically send Adaptive Cards as attachments you
        /// will need to handle that yourself.
        /// </remarks>
        public const string SayCommandActionName = "___SAY___";
    }
}
