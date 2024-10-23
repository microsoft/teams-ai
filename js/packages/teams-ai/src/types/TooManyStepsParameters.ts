/**
 * Parameters passed to the AI.TooManyStepsActionName action.
 */
export interface TooManyStepsParameters {
    /**
     * Configured maximum number of steps allowed.
     */
    max_steps: number;

    /**
     * Configured maximum amount of time allowed.
     */
    max_time: number;

    /**
     * Time the AI system started processing the current activity.
     */
    start_time: number;

    /**
     * Number of steps that have been executed.
     */
    step_count: number;
}
