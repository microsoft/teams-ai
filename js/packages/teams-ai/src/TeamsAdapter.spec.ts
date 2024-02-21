import http from 'http';
import assert from 'assert';
import sinon from 'sinon';
import axios from 'axios';
import express from 'express';

import { TeamsAdapter } from './TeamsAdapter';

describe('TeamsAdapter', () => {
    let sandbox: sinon.SinonSandbox;
    const app = express();
    let server: http.Server;
    let adapter: TeamsAdapter;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        adapter = new TeamsAdapter();

        app.post('/api/messages', async (req, res) => {
            await adapter.process(req, res, async () => {});
        });

        server = app.listen(9876);
    });

    afterEach(() => {
        sandbox.reset();
        server.close();
    });

    describe('process', () => {
        it('should add `User-Agent` header to response', async () => {
            sandbox.stub(adapter, <any>'processActivity').resolves({ status: 200 });
            let userAgent: string | undefined;

            try {
                const res = await axios.post('/api/messages', {
                    type: 'invoke',
                    localTimezone: 'America/Los_Angeles',
                    callerId: 'test',
                    serviceUrl: 'test',
                    channelId: 'test',
                    from: {
                        id: '123456',
                        name: 'test'
                    },
                    conversation: {
                        id: '123456',
                        name: 'test',
                        conversationType: 'test',
                        isGroup: false
                    },
                    recipient: {
                        id: '123456',
                        name: 'test'
                    },
                    text: '',
                    label: 'invoke',
                    valueType: 'invoke'
                });

                userAgent = res.headers['user-agent'];
            } catch (err) {
                if (err instanceof axios.AxiosError) {
                    userAgent = err.response?.headers['user-agent'];
                }
            }

            assert.strict.equal(userAgent, adapter.userAgent);
        });
    });
});
