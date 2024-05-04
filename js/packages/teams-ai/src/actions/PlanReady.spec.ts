import assert from 'assert';

import { planReady } from './PlanReady';
import { StopCommandName } from './Action';

describe('actions.planReady', () => {
    const handler = planReady();

    it('should stop when plan is empty', async () => {
        assert.equal(await handler({} as any, {} as any, { type: 'plan', commands: [] }), StopCommandName);
    });

    it('should continue when plan is not empty', async () => {
        assert.equal(
            await handler({} as any, {} as any, {
                type: 'plan',
                commands: [{ type: 'SAY' }]
            }),
            ''
        );
    });
});
