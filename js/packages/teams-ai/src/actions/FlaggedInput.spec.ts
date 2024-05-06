import assert from 'assert';
import * as sinon from 'sinon';

import { flaggedInput } from './FlaggedInput';
import { StopCommandName } from './Action';

describe('actions.flaggedInput', () => {
    let sandbox: sinon.SinonSandbox;
    const handler = flaggedInput();

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
