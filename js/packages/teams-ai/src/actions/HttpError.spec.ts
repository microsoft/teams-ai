import assert from 'assert';

import { httpError } from './HttpError';

describe('actions.httpError', () => {
    const handler = httpError();

    it('should throw default error', async () => {
        assert.rejects(async () => {
            await handler({} as any, {} as any);
        }, 'An AI http request failed');
    });

    it('should throw given error', async () => {
        assert.rejects(async () => {
            await handler({} as any, {} as any, new Error('a given error'));
        }, 'a given error');
    });
});
