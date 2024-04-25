import assert from 'assert';
import * as sinon from 'sinon';

import { Channels } from 'botbuilder';

import { sayCommand } from './SayCommand';

xdescribe('actions.sayCommand', () => {
    let sandbox: sinon.SinonSandbox;
    const handler = sayCommand();

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should not send activity when response is empty', async () => {
        const context = {
            activity: { channelId: Channels.Msteams },
            sendActivity: async () => {}
        };

        const stub = sandbox.stub(context, 'sendActivity').callThrough();

        const res = await handler(context as any, {} as any, {
            type: 'SAY',
            response: undefined as any
        });

        assert.equal(res, '');
        assert.equal(stub.called, false);
    });

    it('should send a message activity', async () => {
        const context = {
            activity: { channelId: Channels.Msteams },
            sendActivity: async (..._args: any[]) => {}
        };

        const stub = sandbox.stub(context, 'sendActivity').callThrough();
        const res = await handler(context as any, {} as any, {
            type: 'SAY',
            response: {
                role: 'assistant',
                content: 'testing123'
            }
        });

        assert.equal(res, '');
        assert.equal(
            stub.calledOnceWith({
                type: 'message',
                text: 'testing123'
            }),
            true
        );
    });

    it('should send a message activity and replace newline chars', async () => {
        const context = {
            activity: { channelId: Channels.Msteams },
            sendActivity: async (..._args: any[]) => {}
        };

        const stub = sandbox.stub(context, 'sendActivity').callThrough();
        const res = await handler(context as any, {} as any, {
            type: 'SAY',
            response: {
                role: 'assistant',
                content: '\ntesting123\n'
            }
        });

        assert.equal(res, '');
        assert.equal(
            stub.calledOnceWith({
                type: 'message',
                text: '<br>testing123<br>'
            }),
            true
        );
    });

    describe('citations', () => {
        it('should send a message activity with citations', async () => {
            const context = {
                activity: { channelId: Channels.Msteams },
                sendActivity: async (..._args: any[]) => {}
            };

            const stub = sandbox.stub(context, 'sendActivity').callThrough();
            const citations = [
                {
                    title: 'the title',
                    url: 'https://google.com',
                    filepath: '',
                    content: 'some citation text...'
                }
            ];

            const res = await handler(context as any, {} as any, {
                type: 'SAY',
                response: {
                    role: 'assistant',
                    content: '\ntesting123\n',
                    context: {
                        intent: 'my intent',
                        citations
                    }
                }
            });

            assert.equal(res, '');
            assert.equal(
                stub.calledOnceWithExactly({
                    type: 'message',
                    text: '<br>testing123<br>',
                    channelData: {
                        feedbackLoopEnabled: true
                    },
                    entities: [
                        {
                            type: 'https://schema.org/Message',
                            '@type': 'Message',
                            '@context': 'https://schema.org',
                            '@id': '',
                            additionalType: ['AIGeneratedContent'],
                            citation: citations
                        }
                    ]
                }),
                true
            );
        });
    });
});
