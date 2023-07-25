const assert = require('assert');
const { TestAdapter, ActivityTypes, ActivityFactory, TurnContext } = require('../');

const receivedMessage = { text: 'received', type: 'message' };
const originalActivity = { text: 'original', type: 'message' };
const updatedActivity = { text: 'update', type: 'message' };

describe('TestAdapter', function () {
    this.timeout(5000);

    it('should call bot logic when receiveActivity() is called.', async function () {
        const adapter = new TestAdapter((context) => {
            assert(context, 'context not passed to bot logic.');
            assert(context.activity, 'activity not passed through.');
            assert(context.activity.type === ActivityTypes.Message, 'wrong type.');
            assert(context.activity.text === 'test', 'wrong text.');
            assert(context.activity.id, 'missing id.');
            assert(context.activity.from, 'missing from.');
            assert(context.activity.recipient, 'missing recipient.');
            assert(context.activity.conversation, 'missing conversation.');
            assert(context.activity.channelId, 'missing channelId.');
            assert(context.activity.serviceUrl, 'missing serviceUrl.');
        });
        await adapter.receiveActivity('test');
    });

    it('should reject on unhandled error.', async function () {
        const err = new Error('Intentional');
        const adapter = new TestAdapter(() => {
            throw err;
        });
        await assert.rejects(async () => {
            await adapter.send('Message');
        }, err);
    });

    it('should call finally when no error happens', async function () {
        const adapter = new TestAdapter(async () => undefined);
        let runFinally = false;

        await adapter.send('Message').finally(() => {
            runFinally = true;
        });
        assert(runFinally, 'Finally was not called');
    });

    it('should call finally when an error happens', async function () {
        const err = new Error('Intentional');
        const adapter = new TestAdapter(() => {
            throw err;
        });
        let runFinally = false;

        await assert.rejects(async () => {
            await adapter.send('Message').finally(() => {
                runFinally = true;
            });
        }, err);
        assert(runFinally, 'Finally was not called');
    });

    it('should support receiveActivity() called with an Activity.', async function () {
        const adapter = new TestAdapter((context) => {
            assert(context.activity.type === ActivityTypes.Message, 'wrong type.');
            assert(context.activity.text === 'test', 'wrong text.');
        });
        await adapter.receiveActivity({ text: 'test', type: ActivityTypes.Message });
    });

    it('should automatically set the type when receiveActivity() is called with an Activity.', async function () {
        const adapter = new TestAdapter((context) => {
            assert(context.activity.type === ActivityTypes.Message, 'wrong type.');
            assert(context.activity.text === 'test', 'wrong text.');
        });
        await adapter.receiveActivity({ text: 'test' });
    });

    it('should support passing your own Activity.Id to receiveActivity().', async function () {
        const adapter = new TestAdapter((context) => {
            assert(context.activity.id === 'myId', 'custom ID not passed through.');
            assert(context.activity.type === ActivityTypes.Message, 'wrong type.');
            assert(context.activity.text === 'test', 'wrong text.');
        });
        await adapter.receiveActivity({ text: 'test', type: ActivityTypes.Message, id: 'myId' });
    });

    it('should call bot logic when send() is called.', async function () {
        let called = false;
        const adapter = new TestAdapter(() => {
            called = true;
        });

        await adapter.send('test');

        assert(called);
    });

    it('should return a message to assertReply().', async function () {
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });
        await adapter.send('test').assertReply('received').startTest();
    });

    it('async startTest().', async function () {
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });

        await adapter.send('test').assertReply('received').startTest();
    });

    it('should send and receive when test() is called.', async function () {
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });
        await adapter.test('test', 'received').startTest();
    });

    it('should support multiple calls to test().', async function () {
        let count = 0;
        const adapter = new TestAdapter((context) => {
            count++;
            return context.sendActivity(receivedMessage);
        });
        await adapter
            .test('test', 'received')
            .test('test', 'received')
            .test('test', 'received')
            .test('test', 'received')
            .test('test', 'received')
            .startTest();
        assert(count == 5, `incorrect count of "${count}".`);
    });

    it('should support context.updateActivity() calls.', async function () {
        let activityId;
        const adapter = new TestAdapter(async (context) => {
            if (context.activity.text == 'update') {
                await context.updateActivity(Object.assign({ id: activityId }, updatedActivity));
            } else {
                const response = await context.sendActivity(originalActivity);
                activityId = response.id;
            }
        });
        await adapter.send('test').send('update').assertReply('update').startTest();
    });

    it('should support context.deleteActivity() calls.', async function () {
        let activityId;
        const adapter = new TestAdapter(async (context) => {
            if (context.activity.text == 'delete') {
                await context.deleteActivity({ activityId });
            } else {
                const response = await context.sendActivity(originalActivity);
                activityId = response.id;
            }
        });
        await adapter.send('test').send('delete').assertNoReply().startTest();
    });

    it('should delay() before running another test.', async function () {
        const start = new Date().getTime();
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });
        await adapter.test('test', 'received').delay(600).test('test', 'received').startTest();
        const end = new Date().getTime();
        assert(end - start >= 500, "didn't delay before moving on.");
    });

    it('should support calling assertReply() with an expected Activity.', async function () {
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });
        await adapter.send('test').assertReply({ text: 'received' }).startTest();
    });

    it('should support calling assertReply() with a custom inspector.', async function () {
        let called = false;
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });
        await adapter
            .send('test')
            .assertReply((reply) => {
                assert(reply, 'reply not passed');
                called = true;
            })
            .startTest();
        assert(called, 'inspector not called.');
    });

    it('should timeout waiting for assertReply() when a string is expected.', async function () {
        const adapter = new TestAdapter(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(), 600);
            });
        });
        await assert.rejects(
            async () => await adapter.send('test').assertReply('received', 'received failed', 500).startTest(),
            /.*Timed out after.*/
        );
    });

    it('should timeout waiting for assertReply() when an Activity is expected.', async function () {
        const adapter = new TestAdapter(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(), 600);
            });
        });
        await assert.rejects(
            async () =>
                await adapter.send('test').assertReply({ text: 'received' }, 'received failed', 500).startTest(),
            /.*Timed out after.*/
        );
    });

    it('should timeout waiting for assertReply() when a custom inspector is expected.', async function () {
        const adapter = new TestAdapter(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(), 600);
            });
        });
        await assert.rejects(
            async () =>
                await adapter
                    .send('test')
                    .assertReply(() => assert(false, "inspector shouldn't be called."), 'received failed', 500)
                    .startTest(),
            /.*Timed out after.*/
        );
    });

    it('should timeout waiting for assertNoReply() when an Activity is not expected.', async function () {
        const adapter = new TestAdapter(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(), 600);
            });
        });
        await assert.doesNotReject(
            async () => await adapter.send('test').assertNoReply('no message received', 500).startTest()
        );
    });

    it('should validate using assertNoReply() that no reply was received, when reply Activity not expected.', async function () {
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });
        await adapter
            .send('test')
            .assertReply({ text: 'received' })
            .assertNoReply('should be no additional replies')
            .startTest();
    });

    it('should throw an error with assertNoReply() when no reply is expected, but reply Activity was received.', async function () {
        const adapter = new TestAdapter((context) => {
            const activities = [receivedMessage, receivedMessage];
            return context.sendActivities(activities);
        });
        await assert.rejects(
            async () =>
                await adapter
                    .send('test')
                    .assertReply({ text: 'received' })
                    .assertNoReply('should be no additional replies')
                    .startTest(),
            /.*should be no additional replies.*/
        );
    });

    it('should support calling assertReplyOneOf().', async function () {
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });
        await adapter.send('test').assertReplyOneOf(['foo', 'bar', 'received']).startTest();
    });

    it('should fail assertReplyOneOf() call for invalid response.', async function () {
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(receivedMessage);
        });
        await assert.rejects(async () => await adapter.send('test').assertReplyOneOf(['foo', 'bar']).startTest(), {
            message: 'TestAdapter.assertReplyOneOf():  FAILED, Expected one of :["foo","bar"]',
        });
    });

    it('should return an error from continueConversation().', async function () {
        const adapter = new TestAdapter(() => {
            assert.fail("shouldn't run bot logic.");
        });
        await assert.rejects(async () => await adapter.continueConversation(), {
            message: 'not implemented',
        });
    });

    it('should apply the user-defined Activity template.', async function () {
        const template = {
            channelId: 'foo',
            from: { id: 'foo', name: 'Foo' },
        };
        const adapter = new TestAdapter((context) => {
            assert(context.activity.channelId === template.channelId, 'activity channelId does not match template.');
            assert(context.activity.from.id === template.from.id, 'activity from.id does not match template.');
            assert(context.activity.from.name === template.from.name, 'activity from.name does not match template.');
            assert(context.activity.serviceUrl, 'missing serviceUrl.');
        }, template);

        await adapter.send('test');
    });

    it("should test activities that have a from.role normalized value of 'bot' via testActivities().", async function () {
        // Counter to keep track of how many times the bot logic is run.
        let counter = 0;
        const adapter = new TestAdapter((context) => {
            counter++;
            return context.sendActivity('Greetings User!');
        });

        // We create two activities, one which is a message from the user to the bot.
        // The other is the bot's response.
        // The bot's logic should only run once, when it receives the 'Hello' from the user.
        const activities = [
            {
                from: {
                    role: 'User',
                    name: 'User',
                    id: 'user',
                },
                type: 'message',
                text: 'Hello',
            },
            {
                from: {
                    role: 'Bot',
                    name: 'Bot',
                    id: 'bot',
                },
                type: 'message',
                text: 'Greetings User!',
            },
        ];

        await adapter.testActivities(activities);
        assert(counter === 1, 'should have only run bot logic once.');
    });

    it("should run the bot's logic to activities without a from property via testActivities().", async function () {
        let counter = 0;
        const adapter = new TestAdapter(() => {
            counter++;
        });

        // These conversationUpdate activities should trigger the bot's logic to run.
        const activities = [
            {
                type: 'conversationUpdate',
                membersAdded: [{ name: 'Bot', id: 'bot' }],
            },
            {
                type: 'conversationUpdate',
                membersAdded: [{ name: 'User', id: 'user' }],
            },
            {
                type: 'conversationUpdate',
                membersRemoved: [
                    { name: 'Bot', id: 'bot' },
                    { name: 'User', id: 'user' },
                ],
            },
        ];

        await adapter.testActivities(activities);
        assert(counter === 3, 'should have run bot logic for activities without the from property.');
    });

    it('should throw error if activities is not passed to testActivities().', async function () {
        const adapter = new TestAdapter((context) => {
            return context.sendActivity(context.activity.text);
        });
        await assert.rejects(async () => adapter.testActivities(), {
            message: 'Missing array of activities',
        });
    });

    it('getUserToken returns null', async function () {
        const adapter = new TestAdapter(async (context) => {
            const token = await context.adapter.getUserToken(context, 'myConnection');
            assert(!token);
        });
        await adapter.send('hi');
    });

    it('getUserToken returns null with code', async function () {
        const adapter = new TestAdapter(async (context) => {
            const token = await context.adapter.getUserToken(context, 'myConnection', '123456');
            assert(!token);
        });
        await adapter.send('hi');
    });

    it('getUserToken returns token', async function () {
        const adapter = new TestAdapter();
        const connectionName = 'myConnection';
        const channelId = 'directline';
        const userId = 'testUser';
        const token = 'abc123';
        const activity = ActivityFactory.buildActivity({
            channelId,
            from: {
                id: userId,
            },
        });
        const context = new TurnContext(adapter, activity);
        adapter.addUserToken(connectionName, channelId, userId, token);

        const tokenResponse = await adapter.getUserToken(context, connectionName);
        assert(tokenResponse);
        assert.strictEqual(tokenResponse.token, token);
        assert.strictEqual(tokenResponse.connectionName, connectionName);
    });

    it('getUserToken returns token with code', async function () {
        const adapter = new TestAdapter();
        const connectionName = 'myConnection';
        const channelId = 'directline';
        const userId = 'testUser';
        const token = 'abc123';
        const magicCode = '888999';
        const activity = ActivityFactory.buildActivity({
            channelId,
            from: {
                id: userId,
            },
        });
        const context = new TurnContext(adapter, activity);
        adapter.addUserToken(connectionName, channelId, userId, token, magicCode);

        // First it's null
        let tokenResponse = await adapter.getUserToken(context, connectionName);
        assert.equal(tokenResponse, undefined);

        // Can be retrieved with magic code
        tokenResponse = await adapter.getUserToken(context, connectionName, magicCode);
        assert(tokenResponse);
        assert.strictEqual(tokenResponse.token, token);

        // Then can be retrieved without magic code
        tokenResponse = await adapter.getUserToken(context, connectionName);
        assert(tokenResponse);
        assert.strictEqual(tokenResponse.token, token);
    });

    it('getSignInLink returns token with code', async function () {
        const adapter = new TestAdapter(async (context) => {
            const link = await context.adapter.getSignInLink(context, 'myConnection');
            assert(link);
        });
        await adapter.send('hi');
    });

    it('signOutUser is noop', async function () {
        const adapter = new TestAdapter(async (context) => {
            await context.adapter.signOutUser(context, 'myConnection');
        });
        await adapter.send('hi');
    });

    it('signOutUser logs out user', async function () {
        const adapter = new TestAdapter();
        const connectionName = 'myConnection';
        const channelId = 'directline';
        const userId = 'testUser';
        const token = 'abc123';
        const activity = ActivityFactory.buildActivity({
            channelId,
            from: {
                id: userId,
            },
        });
        const context = new TurnContext(adapter, activity);
        adapter.addUserToken(connectionName, channelId, userId, token);

        let tokenResponse = await adapter.getUserToken(context, connectionName);
        assert(tokenResponse);
        assert.strictEqual(tokenResponse.token, token);

        await adapter.signOutUser(context, connectionName, userId);
        tokenResponse = await adapter.getUserToken(context, connectionName);
        assert.equal(tokenResponse, undefined);
    });

    it('signOutUser with no connectionName signs all out', async function () {
        const adapter = new TestAdapter();
        const channelId = 'directline';
        const userId = 'testUser';
        const token = 'abc123';
        const activity = ActivityFactory.buildActivity({
            channelId,
            from: {
                id: userId,
            },
        });
        const context = new TurnContext(adapter, activity);
        adapter.addUserToken('ABC', channelId, userId, token);
        adapter.addUserToken('DEF', channelId, userId, token);

        let tokenResponse = await adapter.getUserToken(context, 'ABC');
        assert(tokenResponse);
        assert.strictEqual(tokenResponse.token, token);

        tokenResponse = await adapter.getUserToken(context, 'DEF');
        assert(tokenResponse);
        assert.strictEqual(tokenResponse.token, token);

        await adapter.signOutUser(context);
        tokenResponse = await adapter.getUserToken(context, 'ABC');
        assert.equal(tokenResponse, undefined);
        tokenResponse = await adapter.getUserToken(context, 'DEF');
        assert.equal(tokenResponse, undefined);
    });

    it('should return statuses from getTokenStatus', async function () {
        const adapter = new TestAdapter(async (context) => {
            const statuses = await context.adapter.getTokenStatus(context, 'user');
            assert(statuses);
            assert(statuses.length == 2);
            assert(statuses.reduce((j, status) => j || status.ConnectionName === 'ABC', false));
        });

        adapter.addUserToken('ABC', 'test', 'user', '123abc');
        adapter.addUserToken('DEF', 'test', 'user', 'def456');
        await adapter.send('hi');
    });

    it('should throw when context parameter is not sent', async function () {
        const adapter = new TestAdapter(async (context) => {
            await assert.rejects(async () => await context.adapter.getTokenStatus(), {
                message: 'testAdapter.getTokenStatus(): context with activity is required',
            });
        });

        adapter.addUserToken('DEF', 'test', 'user', 'def456');
        await adapter.send('hi');
    });

    it('should throw when userId parameter is not sent and context.activity.from.id is not present', async function () {
        const adapter = new TestAdapter(async (context) => {
            context.activity.from = undefined;
            await assert.rejects(async () => await context.adapter.getTokenStatus(context), {
                message: 'testAdapter.getTokenStatus(): missing userId, from or from.id',
            });
        });

        adapter.addUserToken('DEF', 'test', 'user', 'def456');
        await adapter.send('hi');
    });
});
