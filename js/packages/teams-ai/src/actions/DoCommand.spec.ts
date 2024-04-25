import assert from 'assert';
import * as sinon from 'sinon';

import { doCommand } from './DoCommand';

describe('actions.doCommand', () => {
    let sandbox: sinon.SinonSandbox;
    const handler = doCommand();

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should run command', async () => {
        const cmd = () => {
            return 'test';
        };
        const spy = sandbox.spy(cmd);
        assert.equal(
            await handler({} as any, {} as any, {
                type: 'DO',
                action: 'do',
                handler: spy as any,
                parameters: {}
            }),
            'test'
        );
        assert.equal(spy.calledOnce, true);
    });
});
