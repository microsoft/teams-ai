import assert from 'assert';
import * as sinon from 'sinon';

import { unknown } from './Unknown';
import { StopCommandName } from './Action';

describe('actions.unknown', () => {
    let sandbox: sinon.SinonSandbox;
    const handler = unknown();

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should log error', async () => {
        const spy = sandbox.spy(console, 'error');
        assert.equal(await handler({} as any, {} as any, {}, 'test'), StopCommandName);
        assert.equal(spy.calledOnce, true);
    });
});
