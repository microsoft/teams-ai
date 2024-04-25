import assert from 'assert';

import { tooManySteps } from './TooManySteps';

describe('actions.tooManySteps', () => {
    const handler = tooManySteps();

    it('should throw on too many steps', async () => {
        assert.rejects(async () => {
            await handler({} as any, {} as any, {
                max_steps: 1,
                step_count: 2,
                max_time: 0,
                start_time: 0
            });
        }, 'The AI system has exceeded the maximum number of steps allowed.');
    });

    it('should throw on max time exceeded', async () => {
        assert.rejects(async () => {
            await handler({} as any, {} as any, {
                max_steps: 1,
                step_count: 1,
                max_time: 0,
                start_time: 0
            });
        }, 'The AI system has exceeded the maximum amount of time allowed.');
    });
});
