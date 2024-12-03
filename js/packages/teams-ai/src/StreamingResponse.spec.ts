import assert from 'assert';
import { TestAdapter } from 'botbuilder';
import { CardFactory } from 'botbuilder-core';
import { StreamingResponse } from './StreamingResponse';
import { Citation } from './prompts/Message';

describe('StreamingResponse', function () {
    this.timeout(5000);

    describe('constructor()', () => {
        it('should create a StreamingResponse instance', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                assert(response, 'response should not be null');
                assert.equal(response.streamId, undefined, 'streamId should be undefined');
                assert.equal(response.updatesSent, 0, 'updatesSent should be 0');
            });
        });
    });

    describe('sendInformativeUpdate()', () => {
        it('should send an informative update', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.queueInformativeUpdate('starting');
                await response.waitForQueue();
                assert.equal(typeof response.streamId, 'string', 'streamId should be a string');
                assert(response.streamId!.length > 0, 'streamId should not be empty');
                assert.equal(response.updatesSent, 1, 'updatesSent should be 1');

                // Validate sent activity
                const activity = adapter.getNextReply();
                assert.equal(activity.type, 'typing', 'activity.type should be "typing"');
                assert.equal(activity.text, 'starting', 'activity.text should be "starting"');
                assert.deepEqual(
                    activity.channelData,
                    { streamType: 'informative', streamSequence: 1 },
                    'activity.channelData should match'
                );
            });
        });

        it('should increment streamSequence', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.queueInformativeUpdate('first');
                response.queueInformativeUpdate('second');
                await response.waitForQueue();
                assert(response.updatesSent == 2, 'updatesSent should be 2');

                // Validate sent activities
                const activities = adapter.activeQueue;
                assert.equal(activities.length, 2, 'should have sent 2 activities');
                assert.equal(activities[0].channelData.streamSequence, 1, 'first activity streamSequence should be 1');
                assert.equal(activities[1].channelData.streamSequence, 2, 'second activity streamSequence should be 2');
            });
        });

        it('should throw if stream has ended', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.endStream();
                try {
                    response.queueInformativeUpdate('test');
                    await response.waitForQueue();
                    assert.fail('should have thrown an error');
                } catch (err) {
                    assert.equal((err as Error).message, 'The stream has already ended.', 'error message should match');
                }
            });
        });
    });

    describe('sendTextChunk()', () => {
        it('should send a text chunk', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.queueTextChunk('first');
                response.queueTextChunk('second');
                await response.waitForQueue();
                assert(response.updatesSent == 2, 'updatesSent should be 2');

                // Validate sent activities
                const activities = adapter.activeQueue;
                assert.equal(activities.length, 2, 'should have sent 2 activities');
                assert.equal(activities[0].type, 'typing', 'first activity type should be "typing"');
                assert.equal(activities[0].text, 'first', 'first activity text should be "first"');
                assert.deepEqual(
                    activities[0].channelData,
                    { streamType: 'streaming', streamSequence: 1 },
                    'first activity channelData should match'
                );
                assert.equal(activities[1].type, 'typing', 'second activity type should be "typing"');
                assert.equal(activities[1].text, 'firstsecond', 'second activity text should be "firstsecond"');
                assert.deepEqual(
                    activities[1].channelData,
                    { streamType: 'streaming', streamSequence: 2, streamId: response.streamId },
                    'second activity channelData should match'
                );
            });
        });

        it('should throw if stream has ended', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.endStream();
                try {
                    response.queueTextChunk('test');
                    await response.waitForQueue();
                    assert.fail('should have thrown an error');
                } catch (err) {
                    assert.equal((err as Error).message, 'The stream has already ended.', 'error message should match');
                }
            });
        });
    });

    describe('endStream()', () => {
        it('should end the stream immediately', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                await response.endStream();
                assert(response.updatesSent == 0, 'updatesSent should be 0');

                // Validate sent activity
                const activity = adapter.getNextReply();
                assert.equal(activity.type, 'message', 'activity.type should be "message"');
                assert.equal(activity.text, '', 'activity.text should be ""');
                assert.deepEqual(
                    activity.channelData,
                    { streamType: 'final', feedbackLoopEnabled: false },
                    'activity.channelData should match'
                );
            });
        });

        it('should send a final message with text', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.queueTextChunk('first');
                response.queueTextChunk('second');
                await response.waitForQueue();
                await response.endStream();
                assert(response.updatesSent == 2, 'updatesSent should be 2');

                // Validate sent activities
                const activities = adapter.activeQueue;
                assert.equal(activities.length, 3, 'should have sent 3 activities');
                assert.equal(activities[0].channelData.streamSequence, 1, 'first activity streamSequence should be 1');
                assert.equal(activities[1].channelData.streamSequence, 2, 'second activity streamSequence should be 2');
                assert.equal(activities[2].type, 'message', 'final activity type should be "message"');
                assert.equal(activities[2].text, 'firstsecond', 'final activity text should be "firstsecond"');
                assert.deepEqual(
                    activities[2].channelData,
                    { streamType: 'final', streamId: response.streamId, feedbackLoopEnabled: false },
                    'final activity channelData should match'
                );
            });
        });

        it('should send a final message with text and citations', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.setCitations([
                    { content: 'test-content', url: 'https://example.com', title: 'test', filepath: 'test' } as Citation
                ]);
                response.queueTextChunk('first');
                response.queueTextChunk('second');
                await response.waitForQueue();
                await response.endStream();
                assert(response.updatesSent == 2, 'updatesSent should be 2');
                assert(response.citations?.length == 1, 'added 1 citation');

                // Validate sent activities
                const activities = adapter.activeQueue;
                assert.equal(activities.length, 3, 'should have sent 3 activities');
                assert.equal(activities[0].channelData.streamSequence, 1, 'first activity streamSequence should be 1');
                assert.equal(activities[1].channelData.streamSequence, 2, 'second activity streamSequence should be 2');
                assert.equal(activities[2].type, 'message', 'final activity type should be "message"');
                assert.equal(activities[2].text, 'firstsecond', 'final activity text should be "firstsecond"');
                assert.deepEqual(
                    activities[2].channelData,
                    { streamType: 'final', streamId: response.streamId, feedbackLoopEnabled: false },
                    'final activity channelData should match'
                );
            });
        });

        it('should send a final message with powered by AI features', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.queueTextChunk('first');
                response.queueTextChunk('second');
                response.setFeedbackLoop(true);
                response.setGeneratedByAILabel(true);
                await response.waitForQueue();
                await response.endStream();
                assert(response.updatesSent == 2, 'updatesSent should be 2');

                // Validate sent activities
                const activities = adapter.activeQueue;
                assert.equal(activities.length, 3, 'should have sent 3 activities');
                assert.equal(activities[0].channelData.streamSequence, 1, 'first activity streamSequence should be 1');
                assert.equal(activities[0].entities!.length, 1, 'length of first activity entities should be 1');
                assert.deepEqual(
                    activities[0].entities,
                    [{ type: 'streaminfo', ...activities[0].channelData }],
                    'first activity entities should match'
                );
                assert.equal(activities[1].channelData.streamSequence, 2, 'second activity streamSequence should be 2');
                assert.equal(activities[1].entities!.length, 1, 'length of second activity entities should be 1');
                assert.deepEqual(
                    activities[1].entities,
                    [{ type: 'streaminfo', ...activities[1].channelData }],
                    'second activity entities should match'
                );
                assert.equal(activities[2].type, 'message', 'final activity type should be "message"');
                assert.equal(activities[2].text, 'firstsecond', 'final activity text should be "firstsecond"');

                assert.deepEqual(
                    activities[2].channelData,
                    { streamType: 'final', streamId: response.streamId, feedbackLoopEnabled: true },
                    'final activity channelData should match'
                );
                assert.deepEqual(
                    activities[2].entities,
                    [
                        { type: 'streaminfo', streamType: 'final', streamId: response.streamId },
                        {
                            type: 'https://schema.org/Message',
                            '@type': 'Message',
                            '@context': 'https://schema.org',
                            '@id': '',
                            additionalType: ['AIGeneratedContent'],
                            citation: [],
                            usageInfo: undefined
                        }
                    ],
                    'final activity entities obj should match'
                );
            });
        });

        it('should send a final message with text and attachments', async () => {
            const adapter = new TestAdapter();
            const adaptiveCard = {
                $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                version: '1.6',
                type: 'AdaptiveCard',
                body: [
                    {
                        text: 'This is an example of an attachment..',
                        wrap: true,
                        type: 'TextBlock'
                    }
                ]
            };
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.queueTextChunk('first');
                response.queueTextChunk('second');
                await response.waitForQueue();
                await response.setAttachments([CardFactory.adaptiveCard(adaptiveCard)]);
                await response.endStream();
                assert(response.updatesSent == 2, 'updatesSent should be 2');

                // Validate sent activities
                const activities = adapter.activeQueue;
                assert.equal(activities.length, 3, 'should have sent 3 activities');
                assert.equal(activities[0].channelData.streamSequence, 1, 'first activity streamSequence should be 1');
                assert.equal(activities[1].channelData.streamSequence, 2, 'second activity streamSequence should be 2');
                assert.equal(activities[2].type, 'message', 'final activity type should be "message"');
                assert.equal(activities[2].text, 'firstsecond', 'final activity text should be "firstsecond"');
                assert.deepEqual(
                    activities[2].channelData,
                    { streamType: 'final', streamId: response.streamId, feedbackLoopEnabled: false },
                    'final activity channelData should match'
                );
                assert.notEqual(activities[2].attachments, null);
                if (activities[2].attachments) {
                    assert.equal(activities[2].attachments.length, 1, 'should have 1 attachment');
                    assert.deepEqual(activities[2].attachments[0].content, adaptiveCard, 'adaptive card should match');
                }
            });
        });
    });
});
