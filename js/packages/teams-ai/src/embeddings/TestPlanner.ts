import { TurnContext } from 'botbuilder';
import { Plan, Planner, PredictedSayCommand } from '../planners/Planner';
import { TurnState } from '../TurnState';

/**
 * A planner used for testing.
 */
export class TestPlanner implements Planner<TurnState> {
    public constructor(plan?: Plan, promptResponse?: string) {
        this.plan = plan || {
            type: 'plan',
            commands: [{ type: 'SAY', response: 'Hello' } as PredictedSayCommand]
        };
        this.promptResponse = promptResponse;
    }

    public readonly plan: Plan;

    public readonly promptResponse?: string;

    public generatePlan(
        context: TurnContext,
        state: TurnState,
    ): Promise<Plan> {
        return Promise.resolve(this.plan);
    }
}
