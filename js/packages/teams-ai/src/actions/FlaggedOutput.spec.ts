import assert from 'assert';
import * as sinon from 'sinon';

import { flaggedOutput } from './FlaggedOutput';
import { StopCommandName } from './Action';

describe('actions.flaggedOutput', () => {
    let sandbox: sinon.SinonSandbox;
    const handler = flaggedOutput();

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should log error', async () => {
        const spy = sandbox.spy(console, 'error');
        assert.equal(await handler(), StopCommandName);
        assert.equal(spy.calledOnce, true);
    });
});
