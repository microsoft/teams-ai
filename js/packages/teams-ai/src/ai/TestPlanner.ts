import { TurnContext } from 'botbuilder';
import {
    DefaultConversationState,
    DefaultTempState,
    DefaultTurnState,
    DefaultUserState
} from './DefaultTurnStateManager';
import { Plan, Planner, PredictedSayCommand } from './Planner';

/**
 * A planner used for testing.
 */
export class TestPlanner implements Planner<DefaultTurnState> {
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
        state: DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>,
    ): Promise<Plan> {
        return Promise.resolve(this.plan);
    }
}
