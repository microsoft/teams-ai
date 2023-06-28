import { TurnContext } from "botbuilder";
import { ConfiguredAIOptions } from "./AI";
import { DefaultConversationState, DefaultTempState, DefaultTurnState, DefaultUserState } from "./DefaultTurnStateManager";
import { Plan, Planner, PredictedSayCommand } from "./Planner";
import { PromptTemplate } from "./Prompts";


/**
 * A planner used for testing.
 */
export class TestPlanner implements Planner<DefaultTurnState> {
    public constructor(plan?: Plan, promptResponse?: string) {
        this.plan = plan || {
            type: 'plan',
            commands: [
                { type: 'SAY', response: 'Hello' } as PredictedSayCommand
            ]
        };
        this.promptResponse = promptResponse;
    }

    public readonly plan: Plan;

    public readonly promptResponse?: string;


    public completePrompt(context: TurnContext, state: DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>, prompt: PromptTemplate, options: ConfiguredAIOptions<DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>>): Promise<string | undefined> {
        return Promise.resolve(this.promptResponse);
    }

    public generatePlan(context: TurnContext, state: DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>, prompt: PromptTemplate, options: ConfiguredAIOptions<DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>>): Promise<Plan> {
        return Promise.resolve(this.plan);
    }
}
