import { strict as assert } from 'assert';
import { DefaultModerator } from './DefaultModerator';
import { ActivityTypes, TestAdapter, TurnContext } from 'botbuilder-core';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { TurnStateEntry } from './TurnState';
import { ConversationHistory } from './ConversationHistory';
import { Plan, PredictedDoCommand } from './Planner';
import { PromptTemplate } from './Prompts';
import { ConfiguredAIOptions } from './AI';

describe('DefaultModerator', () => {
    const adapter = new TestAdapter();

    const createTurnContextAndState = (): [TurnContext, DefaultTurnState] => {
        const mockTurnContext = new TurnContext(adapter, { text: 'test', type: ActivityTypes.Message });
        const state: DefaultTurnState = {
            conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: [] }),
            user: new TurnStateEntry(),
            dialog: new TurnStateEntry(),
            temp: new TurnStateEntry()
        };
        return [mockTurnContext, state];
    };

    describe('reviewPrompt()', () => {
        it('should return unddefined', async () => {
            const [mockTurnContext, state] = createTurnContextAndState();

            const moderator = new DefaultModerator();

            const plan = await moderator.reviewPrompt(
                mockTurnContext,
                state,
                {} as any as PromptTemplate,
                {} as any as ConfiguredAIOptions<DefaultTurnState>
            );
            assert.equal(plan, undefined);
        });
    });

    describe('reviewPrompt()', () => {
        it('should return the provided plan', async () => {
            const [mockTurnContext, state] = createTurnContextAndState();

            const expectedPlan: Plan = {
                type: 'plan',
                commands: [{} as PredictedDoCommand]
            };

            const moderator = new DefaultModerator();

            const plan = await moderator.reviewPlan(mockTurnContext, state, expectedPlan);
            assert.deepEqual(plan, expectedPlan);
        });
    });
});
