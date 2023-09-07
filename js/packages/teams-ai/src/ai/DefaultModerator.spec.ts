import { strict as assert } from 'assert';
import { DefaultModerator } from './DefaultModerator';
import { ActivityTypes, TestAdapter, TurnContext, MemoryStorage } from 'botbuilder-core';
import { TurnState, TurnStateEntry } from '../TurnState';
import { ConversationHistory } from '../ConversationHistory';
import { Plan, PredictedDoCommand } from './Planner';

describe('DefaultModerator', () => {
    const adapter = new TestAdapter();

    const createTurnContextAndState = async (): Promise<[TurnContext, TurnState]> => {
        const mockTurnContext = new TurnContext(adapter, { text: 'test', type: ActivityTypes.Message });
        const storage = new MemoryStorage();
        const state = new TurnState();
        await state.load(mockTurnContext, storage);
        return [mockTurnContext, state];
    };

    describe('reviewPrompt()', () => {
        it('should return undefined', async () => {
            const [mockTurnContext, state] = await createTurnContextAndState();

            const moderator = new DefaultModerator();

            const plan = await moderator.reviewInput(
                mockTurnContext,
                state,
            );
            assert.equal(plan, undefined);
        });
    });

    describe('reviewPrompt()', () => {
        it('should return the provided plan', async () => {
            const [mockTurnContext, state] = await createTurnContextAndState();

            const expectedPlan: Plan = {
                type: 'plan',
                commands: [{} as PredictedDoCommand]
            };

            const moderator = new DefaultModerator();

            const plan = await moderator.reviewOutput(mockTurnContext, state, expectedPlan);
            assert.deepEqual(plan, expectedPlan);
        });
    });
});
