import { TurnContext } from 'botbuilder';
import { Plan, Planner, PredictedSayCommand } from '../../planners/Planner';
import { TurnState } from '../../TurnState';
import { AI } from '../../AI';

/**
 * A planner used for testing.
 */
export class TestPlanner implements Planner<TurnState> {
    /**
     * Creates a new `TestPlanner` instance.
     * @param {Plan} beginPlan Optional. The plan to return when `beginTask()` is called. Defaults to a plan that says "Hello World".
     * @param {Plan} continuePlan Optional. The plan to return when `continueTask()` is called. Defaults to an empty plan.
     */
    public constructor(beginPlan?: Plan, continuePlan?: Plan) {
        this.beginPlan = beginPlan || {
            type: 'plan',
            commands: [{ type: 'SAY', response: { role: 'assistant', content: 'Hello World' } } as PredictedSayCommand]
        };
        this.continuePlan = continuePlan || {
            type: 'plan',
            commands: []
        };
    }

    /**
     * The plan to return when `beginTask()` is called.
     */
    public beginPlan: Plan;

    /**
     * The plan to return when `continueTask()` is called.
     */
    public continuePlan: Plan;

    /**
     * Starts a new task.
     * @remarks
     * This method is called when the AI system is ready to start a new task. The planner should
     * generate a plan that the AI system will execute. Returning an empty plan signals that
     * there is no work to be performed.
     *
     * The planner should take the users input from `state.temp.input`.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {TurnState} state Application state for the current turn of conversation.
     * @param {AI<TurnState>} ai The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public beginTask(context: TurnContext, state: TurnState, ai: AI<TurnState>): Promise<Plan> {
        return Promise.resolve(this.beginPlan);
    }

    /**
     * Continues the current task.
     * @remarks
     * This method is called when the AI system has finished executing the previous plan and is
     * ready to continue the current task. The planner should generate a plan that the AI system
     * will execute. Returning an empty plan signals that the task is completed and there is no work
     * to be performed.
     *
     * The output from the last plan step that was executed is passed to the planner via `state.temp.input`.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {TurnState} state Application state for the current turn of conversation.
     * @param {AI<TurnState>} ai The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public continueTask(context: TurnContext, state: TurnState, ai: AI<TurnState>): Promise<Plan> {
        return Promise.resolve(this.continuePlan);
    }
}
