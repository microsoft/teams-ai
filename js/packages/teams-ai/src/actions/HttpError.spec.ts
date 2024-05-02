import assert from 'assert';

import { httpError } from './HttpError';

describe('actions.httpError', () => {
    const handler = httpError();

    it('should throw', async () => {
        assert.rejects(async () => {
            await handler();
        }, 'An AI http request failed');
    });
});
