const assert = require('assert');
const sinon = require('sinon');

const {
    ConsoleTranscriptLogger,
    TestAdapter,
    TranscriptLoggerMiddleware,
    MemoryTranscriptStore,
    ActivityTypes,
    ActivityEventNames,
} = require('../');

describe('TranscriptLoggerMiddleware', function () {
    this.timeout(5000);

    it('should log activities', async function () {
        let conversationId = null;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = new TestAdapter(async (context) => {
            conversationId = context.activity.conversation.id;
            const typingActivity = {
                type: ActivityTypes.Typing,
                relatesTo: context.activity.relatesTo,
            };

            await context.sendActivity(typingActivity);
            await context.sendActivity(`echo:${context.activity.text}`);
        }).use(new TranscriptLoggerMiddleware(transcriptStore));

        await adapter
            .send('foo')
            .assertReply((activity) => assert.equal(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .send('bar')
            .assertReply((activity) => assert.equal(activity.type, ActivityTypes.Typing))
            .assertReply('echo:bar')
            .startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.equal(pagedResult.items.length, 6);
        assert.equal(pagedResult.items[0].text, 'foo');
        assert.equal(pagedResult.items[1].type, ActivityTypes.Typing);
        assert.equal(pagedResult.items[2].text, 'echo:foo');
        assert.equal(pagedResult.items[3].text, 'bar');
        assert.equal(pagedResult.items[4].type, ActivityTypes.Typing);
        assert.equal(pagedResult.items[5].text, 'echo:bar');
        pagedResult.items.forEach((a) => {
            assert(a.timestamp);
        });
    });

    it('should log update activities', async function () {
        let conversationId = null;
        let activityToUpdate = null;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = new TestAdapter(async (context) => {
            conversationId = context.activity.conversation.id;
            if (context.activity.text === 'update') {
                activityToUpdate.text = 'new response';
                await context.updateActivity(activityToUpdate);
            } else {
                const activity = createReply(context.activity, 'response');
                const response = await context.sendActivity(activity);
                activity.id = response.id;

                // clone the activity, so we can use it to do an update
                activityToUpdate = JSON.parse(JSON.stringify(activity));
            }
        }).use(new TranscriptLoggerMiddleware(transcriptStore));

        await adapter.send('foo').delay(100).send('update').delay(100).startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert(pagedResult.items.length, 4);
        assert(pagedResult.items[0].text, 'foo');
        assert(pagedResult.items[1].text, 'response');
        assert(pagedResult.items[2].text, 'new response');
        assert(pagedResult.items[3].text, 'update');
    });

    it('should log delete activities', async function () {
        let conversationId = null;
        let activityId = null;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = new TestAdapter(async (context) => {
            conversationId = context.activity.conversation.id;
            if (context.activity.text === 'deleteIt') {
                await context.deleteActivity(activityId);
            } else {
                const activity = createReply(context.activity, 'response');
                const response = await context.sendActivity(activity);
                activityId = response.id;
            }
        }).use(new TranscriptLoggerMiddleware(transcriptStore));

        await adapter.send('foo').assertReply('response').send('deleteIt').delay(500).startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);

        assert(pagedResult.items.length, 4);
        assert(pagedResult.items[0].text, 'foo');
        assert(pagedResult.items[1].text, 'response');
        assert(pagedResult.items[2].text, 'deleteIt');
        assert(pagedResult.items[3].type, ActivityTypes.MessageDelete);
    });

    it('should filter continueConversation events', async function () {
        let conversationId;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = new TestAdapter(async (context) => {
            conversationId = context.activity.conversation.id;
        }).use(new TranscriptLoggerMiddleware(transcriptStore));

        await adapter
            .send('foo')
            .send('bar')
            .send({ type: ActivityTypes.Event, name: ActivityEventNames.ContinueConversation })
            .startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.strictEqual(pagedResult.items.length, 2, 'only the two message activities should be logged');
    });

    it('should not error for sent activities if no ResourceResponses are received', async function () {
        class NoResourceResponseAdapter extends TestAdapter {
            constructor(logic) {
                super(logic);
            }

            // Send activities but don't pass the ResourceResponses to the TranscriptLoggerMiddleware
            async sendActivities(context, activities) {
                await super.sendActivities(context, activities);
            }
        }

        let conversationId = null;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = new NoResourceResponseAdapter(async (context) => {
            conversationId = context.activity.conversation.id;
            const typingActivity = {
                type: ActivityTypes.Typing,
                relatesTo: context.activity.relatesTo,
            };

            await context.sendActivity(typingActivity);
            await context.sendActivity(`echo:${context.activity.text}`);
        }).use(new TranscriptLoggerMiddleware(transcriptStore));

        await adapter
            .send('foo')
            .assertReply((activity) => assert.equal(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .send('bar')
            .assertReply((activity) => assert.equal(activity.type, ActivityTypes.Typing))
            .assertReply('echo:bar')
            .startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.equal(pagedResult.items.length, 6);
        assert.equal(pagedResult.items[0].text, 'foo');
        assert.equal(pagedResult.items[1].type, ActivityTypes.Typing);
        assert.equal(pagedResult.items[2].text, 'echo:foo');
        assert.equal(pagedResult.items[3].text, 'bar');
        assert.equal(pagedResult.items[4].type, ActivityTypes.Typing);
        assert.equal(pagedResult.items[5].text, 'echo:bar');
        pagedResult.items.forEach((a) => {
            assert(a.timestamp);
        });
    });

    it('should not error for sent activities if another handler does not return next()', async function () {
        class NoResourceResponseMiddleware {
            async onTurn(context, next) {
                context.onSendActivities(async (context, activities, next) => {
                    // In SendActivitiesHandlers developers are supposed to call:
                    //      return next();
                    // If this is not returned, then the next handler will not have the ResourceResponses[].
                    await next();
                });

                // Run the bot's application logic.
                await next();
            }
        }

        let conversationId = null;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = new TestAdapter(async (context) => {
            conversationId = context.activity.conversation.id;
            const typingActivity = {
                type: ActivityTypes.Typing,
                relatesTo: context.activity.relatesTo,
            };

            await context.sendActivity(typingActivity);
            await context.sendActivity(`echo:${context.activity.text}`);
        });

        // Register both middleware
        adapter.use(new TranscriptLoggerMiddleware(transcriptStore));
        adapter.use(new NoResourceResponseMiddleware());

        await adapter
            .send('foo')
            .assertReply((activity) => assert.equal(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .send('bar')
            .assertReply((activity) => assert.equal(activity.type, ActivityTypes.Typing))
            .assertReply('echo:bar')
            .startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.equal(pagedResult.items.length, 6);
        assert.equal(pagedResult.items[0].text, 'foo');
        assert.equal(pagedResult.items[1].type, ActivityTypes.Typing);
        assert.equal(pagedResult.items[2].text, 'echo:foo');
        assert.equal(pagedResult.items[3].text, 'bar');
        assert.equal(pagedResult.items[4].type, ActivityTypes.Typing);
        assert.equal(pagedResult.items[5].text, 'echo:bar');
        pagedResult.items.forEach((a) => {
            assert(a.timestamp);
        });
    });

    it('should not error for sent activities if another handler does not return an array', async function () {
        class NoResourceResponseMiddleware {
            async onTurn(context, next) {
                context.onSendActivities(async (context, activities, next) => {
                    // In SendActivitiesHandlers developers are supposed to call:
                    //      return next();
                    // If this is not returned, then the next handler will not have the ResourceResponses[].
                    await next();

                    return {};
                });

                // Run the bot's application logic.
                await next();
            }
        }

        let conversationId = null;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = new TestAdapter(async (context) => {
            conversationId = context.activity.conversation.id;
            await context.sendActivity(`echo:${context.activity.text}`);
        });

        // Register both middleware
        adapter.use(new TranscriptLoggerMiddleware(transcriptStore));
        adapter.use(new NoResourceResponseMiddleware());

        await adapter.send('foo').assertReply('echo:foo').startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.equal(pagedResult.items.length, 2);
        assert.equal(pagedResult.items[0].text, 'foo');
        assert.equal(pagedResult.items[1].text, 'echo:foo');
        pagedResult.items.forEach((a) => {
            assert(a.id);
            assert(a.timestamp);
        });
    });

    it('should not error when logging sent activities and return the actual value from next()', async function () {
        // This middleware should receive 1 from `next()`
        class AssertionMiddleware {
            async onTurn(context, next) {
                context.onSendActivities(async (context, activities, next) => {
                    const notResourceResponses = await next();
                    assert.strictEqual(notResourceResponses, 1);
                });

                await next();
            }
        }
        // This middleware returns the value 1 from its registered SendActivitiesHandler.
        // The TranscriptLoggerMiddleware should return this value to the next registered SendActivitiesHandler.
        class Returns1Middleware {
            async onTurn(context, next) {
                context.onSendActivities(async (context, activities, next) => {
                    // In SendActivitiesHandlers developers are supposed to call:
                    //      return next();
                    // If this is not returned, then the next handler will not have the ResourceResponses[].
                    await next();

                    return 1;
                });

                await next();
            }
        }

        let conversationId = null;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = new TestAdapter(async (context) => {
            conversationId = context.activity.conversation.id;
            await context.sendActivity(`echo:${context.activity.text}`);
        });

        adapter.use(new AssertionMiddleware());
        adapter.use(new TranscriptLoggerMiddleware(transcriptStore));
        adapter.use(new Returns1Middleware());

        await adapter.send('foo').assertReply('echo:foo').startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.equal(pagedResult.items.length, 2);
        assert.equal(pagedResult.items[0].text, 'foo');
        assert.equal(pagedResult.items[1].text, 'echo:foo');
        pagedResult.items.forEach((a) => {
            assert(a.id);
            assert(a.timestamp);
        });
    });

    describe("'s error handling", function () {
        let sandbox;
        beforeEach(function () {
            sandbox = sinon.createSandbox();
        });

        afterEach(function () {
            sandbox.restore();
        });

        // Returns an adapter that is expected to throw (or, IFF `async` is true, yield a Promise rejecting)
        // `expectedError`. All behavior can be verified by calling `sandbox.verify()`.
        const mockedAdapter = (expectedError, async = false) => {
            const logger = new ConsoleTranscriptLogger();

            const adapter = new TestAdapter(async () => {
                // noop
            }).use(new TranscriptLoggerMiddleware(logger));

            const mLogger = sandbox.mock(logger);
            if (async) {
                mLogger.expects('logActivity').returns(Promise.reject(expectedError));
            } else {
                mLogger.expects('logActivity').throws(expectedError);
            }

            const mConsole = sandbox.mock(console);

            const prefix = 'TranscriptLoggerMiddleware logActivity failed';
            if (expectedError instanceof Error) {
                mConsole.expects('error').withArgs(`${prefix}: "${expectedError.message}"`).once();
                mConsole.expects('error').withArgs(expectedError.stack).once();
            } else {
                mConsole
                    .expects('error')
                    .withArgs(`${prefix}: "${JSON.stringify(expectedError)}"`)
                    .once();
            }

            return adapter;
        };

        const testCases = [
            { label: 'errors', expectedError: new Error('error message') },
            { label: 'thrown info', expectedError: 10 },
        ];

        testCases.forEach((testCase) => {
            it(`should print to console ${testCase.label} from synchronous logActivity()`, async function () {
                await mockedAdapter(testCase.expectedError).send('test').startTest();
                sandbox.verify();
            });

            it(`should print to console ${testCase.label} from asynchronous logActivity().`, async function () {
                await mockedAdapter(testCase.expectedError, true).send('test').startTest();
                await new Promise((resolve) => process.nextTick(resolve));
                sandbox.verify();
            });
        });
    });

    it('should add resource response id to activity when activity id is empty', async function () {
        let conversationId = null;
        const transcriptStore = new MemoryTranscriptStore();
        const adapter = createTestAdapterWithNoResourceResponseId(async (context) => {
            conversationId = context.activity.conversation.id;

            await context.sendActivity(`echo:${context.activity.text}`);
        }).use(new TranscriptLoggerMiddleware(transcriptStore));

        const fooActivity = {
            type: ActivityTypes.Message,
            id: 'testFooId',
            text: 'foo',
        };

        await adapter
            .send(fooActivity)
            // sent activities do not contain the id returned from the service, so it should be undefined here
            .assertReply((activity) => assert.equal(activity.id, undefined) && assert.equal(activity.text, 'echo:foo'))
            .send('bar')
            .assertReply((activity) => assert.equal(activity.id, undefined) && assert.equal(activity.text, 'echo:bar'))
            .startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.equal(pagedResult.items.length, 4);
        assert.equal(pagedResult.items[0].text, 'foo');
        // Transcript activities should have the id present on the activity when received
        assert.equal(pagedResult.items[0].id, 'testFooId');

        assert.equal(pagedResult.items[1].text, 'echo:foo');
        assert.equal(pagedResult.items[2].text, 'bar');
        assert.equal(pagedResult.items[3].text, 'echo:bar');

        pagedResult.items.forEach((a) => {
            assert(a.timestamp);
            assert(a.id);
        });
    });

    it("should use outgoing activity's timestamp for activity id when activity id and resourceResponse is empty", async function () {
        let conversationId, timestamp;
        const transcriptStore = new MemoryTranscriptStore();

        const adapter = createTestAdapterWithNoResourceResponseId(async (context) => {
            conversationId = context.activity.conversation.id;

            timestamp = new Date(Date.now());
            await context.sendActivity({
                text: `echo:${context.activity.text}`,
                timestamp: timestamp,
                type: ActivityTypes.Message,
            });
        }).use(new TranscriptLoggerMiddleware(transcriptStore));

        const fooActivity = {
            type: ActivityTypes.Message,
            id: 'testFooId',
            text: 'foo',
        };

        await adapter
            .send(fooActivity)
            // sent activities do not contain the id returned from the service, so it should be undefined here
            .assertReply((activity) => {
                assert.equal(activity.id, undefined);
                assert.equal(activity.text, 'echo:foo');
                assert.equal(activity.timestamp, timestamp);
            })
            .startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.equal(pagedResult.items.length, 2);
        assert.equal(pagedResult.items[0].text, 'foo');
        // Transcript activities should have the id present on the activity when received
        assert.equal(pagedResult.items[0].id, 'testFooId');

        assert.equal(pagedResult.items[1].text, 'echo:foo');
        // Sent Activities in the transcript store should use the timestamp on the bot's outgoing activities
        // to log the activity when the following cases are true:
        // 1. The outgoing Activity.id is falsey
        // 2. The ResourceResponse.id is falsey (some channels may not emit a ResourceResponse with an id value)
        // 3. The outgoing Activity.timestamp exists
        assert(pagedResult.items[1].id.indexOf(timestamp.getTime().toString()));
        assert(pagedResult.items[1].id.startsWith('g_'));
        pagedResult.items.forEach((a) => {
            assert(a.timestamp);
        });
    });

    it('should use current server time for activity id when activity and resourceResponse id is empty and no activity timestamp exists', async function () {
        let conversationId;
        const transcriptStore = new MemoryTranscriptStore();

        const adapter = createTestAdapterWithNoResourceResponseId(async (context) => {
            conversationId = context.activity.conversation.id;

            await context.sendActivity({
                text: `echo:${context.activity.text}`,
                type: ActivityTypes.Message,
            });
        }).use(new TranscriptLoggerMiddleware(transcriptStore));

        const fooActivity = {
            type: ActivityTypes.Message,
            id: 'testFooId',
            text: 'foo',
        };

        await adapter
            .send(fooActivity)
            // sent activities do not contain the id returned from the service, so it should be undefined here
            .assertReply((activity) => {
                assert.equal(activity.id, undefined);
                assert.equal(activity.text, 'echo:foo');
            })
            .startTest();

        const pagedResult = await transcriptStore.getTranscriptActivities('test', conversationId);
        assert.equal(pagedResult.items.length, 2);
        assert.equal(pagedResult.items[0].text, 'foo');
        // Transcript activities should have the id present on the activity when received
        assert.equal(pagedResult.items[0].id, 'testFooId');

        assert.equal(pagedResult.items[1].text, 'echo:foo');
        // Sent Activities in the transcript store should use the time the TranscriptLoggerMiddleware attempted
        // to log the activity when the following cases are true:
        // 1. The outgoing Activity.id is falsey
        // 2. The ResourceResponse.id is falsey (some channels may not emit a ResourceResponse with an id value)
        // 3. The outgoing Activity.timestamp is falsey
        assert(pagedResult.items[1].id);
        pagedResult.items.forEach((a) => {
            assert(a.timestamp);
        });
    });
});

function createTestAdapterWithNoResourceResponseId(logic) {
    const modifiedAdapter = new TestAdapter(logic);

    function sendActivities(context, activities) {
        const responses = activities
            .filter((a) => this.sendTraceActivities || a.type !== 'trace')
            .map((activity) => {
                this.activityBuffer.push(activity);
                return {};
            });

        return Promise.resolve(responses);
    }
    modifiedAdapter.sendActivities = sendActivities.bind(modifiedAdapter);

    return modifiedAdapter;
}

function createReply(activity, text, locale = null) {
    return {
        type: ActivityTypes.Message,
        from: { id: activity.recipient.id, name: activity.recipient.name },
        recipient: { id: activity.from.id, name: activity.from.name },
        replyToId: activity.id,
        serviceUrl: activity.serviceUrl,
        channelId: activity.channelId,
        conversation: {
            isGroup: activity.conversation.isGroup,
            id: activity.conversation.id,
            name: activity.conversation.name,
        },
        text: text || '',
        locale: locale || activity.locale,
    };
}
