import assert from 'assert';
import { TestAdapter } from "botbuilder";
import { StreamingResponse } from './StreamingResponse';

describe('StreamingResponse', function() {
    describe('constructor()', () => {
        it('should create a StreamingResponse instance', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                assert(response, 'response should not be null');
                assert.equal(response.streamId, undefined, 'streamId should be undefined');
                assert.equal(response.updatesSent, 0, 'updatesSent should be 0');
            });;
        });
    });

    describe('sendInformativeUpdate()', () => {
        it('should send an informative update', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                await response.sendInformativeUpdate('starting');
                assert.equal(typeof response.streamId, 'string', 'streamId should be a string');
                assert(response.streamId!.length > 0, 'streamId should not be empty');
                assert.equal(response.updatesSent, 1, 'updatesSent should be 1');

                // Validate sent activity
                const activity = adapter.getNextReply();
                assert.equal(activity.type, 'typing', 'activity.type should be "typing"');
                assert.equal(activity.text, 'starting', 'activity.text should be "starting"');
                assert.deepEqual(activity.channelData, { streamType: 'informative', streamSequence: 1 }, 'activity.channelData should match');
            });
        });

        it('should increment streamSequence', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                await response.sendInformativeUpdate('first');
                await response.sendInformativeUpdate('second');
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
                    await response.sendInformativeUpdate('test');
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
                await response.sendTextChunk('first');
                await response.sendTextChunk('second');
                assert(response.updatesSent == 2, 'updatesSent should be 2');

                // Validate sent activities
                const activities = adapter.activeQueue;
                assert.equal(activities.length, 2, 'should have sent 2 activities');
                assert.equal(activities[0].type, 'typing', 'first activity type should be "typing"');
                assert.equal(activities[0].text, 'first', 'first activity text should be "first"');
                assert.deepEqual(activities[0].channelData, { streamType: 'streaming', streamSequence: 1 }, 'first activity channelData should match');
                assert.equal(activities[1].type, 'typing', 'second activity type should be "typing"');
                assert.equal(activities[1].text, 'second', 'second activity text should be "second"');
                assert.deepEqual(activities[1].channelData, { streamType: 'streaming', streamSequence: 2, streamId: response.streamId }, 'second activity channelData should match');
            });
        });

        it('should throw if stream has ended', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                response.endStream();
                try {
                    await response.sendTextChunk('test');
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
                assert(response.updatesSent == 1, 'updatesSent should be 1');

                // Validate sent activity
                const activity = adapter.getNextReply();
                assert.equal(activity.type, 'message', 'activity.type should be "message"');
                assert.equal(activity.text, '', 'activity.text should be ""');
                assert.deepEqual(activity.channelData, { streamType: 'final', streamSequence: 1 }, 'activity.channelData should match');
            });
        });

        it ('should send a final message with text', async () => {
            const adapter = new TestAdapter();
            await adapter.sendTextToBot('test', async (context) => {
                const response = new StreamingResponse(context);
                await response.sendTextChunk('first');
                await response.sendTextChunk('second');
                await response.endStream();
                assert(response.updatesSent == 3, 'updatesSent should be 3');

                // Validate sent activities
                const activities = adapter.activeQueue;
                assert.equal(activities.length, 3, 'should have sent 3 activities');
                assert.equal(activities[0].channelData.streamSequence, 1, 'first activity streamSequence should be 1');
                assert.equal(activities[1].channelData.streamSequence, 2, 'second activity streamSequence should be 2');
                assert.equal(activities[2].channelData.streamSequence, 3, 'final activity streamSequence should be 3');
                assert.equal(activities[2].type, 'message', 'final activity type should be "message"');
                assert.equal(activities[2].text, 'firstsecond', 'final activity text should be "firstsecond"');
                assert.deepEqual(activities[2].channelData, { streamType: 'final', streamSequence: 3, streamId: response.streamId }, 'final activity channelData should match');
            });
        });
    });
});