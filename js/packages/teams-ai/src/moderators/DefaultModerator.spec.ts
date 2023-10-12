import { strict as assert } from 'assert';
import { DefaultModerator } from './DefaultModerator';
import { TestAdapter } from 'botbuilder';
import { TestTurnState } from '../TestTurnState';
import { Plan, PredictedDoCommand } from '../planners/Planner';

describe('DefaultModerator', () => {
    const adapter = new TestAdapter();
    const expectedPlan: Plan = {
        type: 'plan',
        commands: [{} as PredictedDoCommand]
    };

    describe('reviewInput()', () => {
        it('should return undefined', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const moderator = new DefaultModerator();
                const plan = await moderator.reviewInput(context, state);
                assert.equal(plan, undefined);
            });
        });
    });

    describe('reviewOutput()', () => {
        it('should return the provided plan', async () => {
            await adapter.sendTextToBot('test', async (context) => {
                const state = await TestTurnState.create(context);
                const moderator = new DefaultModerator();
                const plan = await moderator.reviewOutput(context, state, expectedPlan);
                assert.deepEqual(plan, expectedPlan);
            });
        });
    });
});
