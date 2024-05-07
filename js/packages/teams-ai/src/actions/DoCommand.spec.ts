import assert from 'assert';

import { doCommand } from './DoCommand';

describe('actions.doCommand', () => {
    const handler = doCommand();

    it('should run command', async () => {
        const cmd = async () => 'test';
        const res = await handler({} as any, {} as any, {
            type: 'DO',
            action: '',
            handler: cmd,
            parameters: {}
        });

        assert.equal(res, 'test');
    });
});
