import { TurnContext } from 'botbuilder';
import { Plan, Planner, PredictedSayCommand } from './Planner';
import { TurnState } from '../TurnState';
import { AI } from '../AI';

/**
 * A planner used for testing.
 */
export class TestPlanner implements Planner<TurnState> {
    public constructor(beginPlan?: Plan, continuePlan?: Plan) {
        this.beginPlan = beginPlan || {
            type: 'plan',
            commands: [{ type: 'SAY', response: 'Hello World' } as PredictedSayCommand]
        };
        this.continuePlan = continuePlan || {
            type: 'plan',
            commands: []
        };
    }

    public readonly beginPlan: Plan;
    public readonly continuePlan: Plan;

    public beginTask(
        context: TurnContext,
        state: TurnState,
        ai: AI<TurnState>
    ): Promise<Plan> {
        return Promise.resolve(this.beginPlan);
    }

    public continueTask(
        context: TurnContext,
        state: TurnState,
        ai: AI<TurnState>
    ): Promise<Plan> {
        return Promise.resolve(this.continuePlan);
    }
}
