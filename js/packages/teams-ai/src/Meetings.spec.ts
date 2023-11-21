import { strict as assert } from 'assert';
import { Application } from './Application';
import { ActivityTypes, Channels, TestAdapter } from 'botbuilder';

describe('Meetings', () => {
    let adapter: TestAdapter;
    let mockApp: Application;
    beforeEach(() => {
        adapter = new TestAdapter();
        mockApp = new Application({ adapter });
    });

    /**
     * Two shared test cases where the activityType isn't Event or the channelId is not msteams.
     */
    const sharedTestCases = [
        {
            testCase: 'should not trigger the handler when the activity type is not Event',
            testActivity: {
                type: ActivityTypes.Message,
                channelId: Channels.Msteams,
                name: 'application/vnd.microsoft.meetingStart',
                value: {}
            }
        },
        {
            testCase: 'should not trigger the handler when the channelId is not msteams',
            testActivity: {
                type: ActivityTypes.Event,
                channelId: Channels.Directline,
                name: 'application/vnd.microsoft.meetingStart',
                value: {}
            }
        }
    ];

    const happyPathTestActivity = {
        type: ActivityTypes.Event,
        channelId: Channels.Msteams,
        // name is intentionally not assigned here - will be assigned in the test case.
        name: '',
        value: {
            meetingType: 'scheduled',
            startTime: '2020-10-01T00:00:00.000Z',
            endTime: '2020-10-01T00:30:00.000Z'
        }
    };

    describe('start', () => {
        for (const { testCase, testActivity } of sharedTestCases) {
            it(testCase, async () => {
                let handlerCalled = false;
                mockApp.meetings.start(async (_context, _state, _meeting) => {
                    // Should not reach here.
                    handlerCalled = true;
                });
                await adapter.processActivity(testActivity, async (context) => {
                    await mockApp.run(context);
                    assert.equal(handlerCalled, false);
                });
            });
        }

        it('should trigger the handler when the channel, event, and name are correct', async () => {
            let handlerCalled = false;
            happyPathTestActivity.name = 'application/vnd.microsoft.meetingStart';
            mockApp.meetings.start(async (_context, _state, meeting) => {
                handlerCalled = true;
                assert.deepEqual(meeting, happyPathTestActivity.value);
            });
            await adapter.processActivity(happyPathTestActivity, async (context) => {
                await mockApp.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });

    describe('end', () => {
        for (const { testCase, testActivity } of sharedTestCases) {
            it(testCase, async () => {
                let handlerCalled = false;
                mockApp.meetings.end(async (_context, _state, _meeting) => {
                    // Should not reach here.
                    handlerCalled = true;
                });
                await adapter.processActivity(testActivity, async (context) => {
                    await mockApp.run(context);
                    assert.equal(handlerCalled, false);
                });
            });
        }

        it('should trigger the handler when the channel, event, and name are correct', async () => {
            let handlerCalled = false;
            happyPathTestActivity.name = 'application/vnd.microsoft.meetingEnd';
            mockApp.meetings.end(async (_context, _state, meeting) => {
                handlerCalled = true;
                assert.deepEqual(meeting, happyPathTestActivity.value);
            });
            await adapter.processActivity(happyPathTestActivity, async (context) => {
                await mockApp.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });

    describe('participantsJoin', () => {
        for (const { testCase, testActivity } of sharedTestCases) {
            it(testCase, async () => {
                let handlerCalled = false;
                mockApp.meetings.participantsJoin(async (_context, _state, _meeting) => {
                    // Should not reach here.
                    handlerCalled = true;
                });
                await adapter.processActivity(testActivity, async (context) => {
                    mockApp.run(context);
                    assert.equal(handlerCalled, false);
                });
            });
        }

        it('should trigger the handler when the channel, event, and name are correct', async () => {
            let handlerCalled = false;
            happyPathTestActivity.name = 'application/vnd.microsoft.meetingParticipantsJoin';
            mockApp.meetings.participantsJoin(async (_context, _state, meeting) => {
                handlerCalled = true;
                assert.deepEqual(meeting, happyPathTestActivity.value);
            });
            await adapter.processActivity(happyPathTestActivity, async (context) => {
                await mockApp.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });

    describe('participantsLeave', () => {
        for (const { testCase, testActivity } of sharedTestCases) {
            it(testCase, async () => {
                let handlerCalled = false;
                mockApp.meetings.participantsLeave(async (_context, _state, _meeting) => {
                    // Should not reach here.
                    handlerCalled = true;
                });
                await adapter.processActivity(testActivity, async (context) => {
                    await mockApp.run(context);
                    assert.equal(handlerCalled, false);
                });
            });
        }

        it('should trigger the handler when the channel, event, and name are correct', async () => {
            let handlerCalled = false;
            happyPathTestActivity.name = 'application/vnd.microsoft.meetingParticipantsLeave';
            mockApp.meetings.participantsLeave(async (_context, _state, meeting) => {
                handlerCalled = true;
                assert.deepEqual(meeting, happyPathTestActivity.value);
            });
            await adapter.processActivity(happyPathTestActivity, async (context) => {
                await mockApp.run(context);
                assert.equal(handlerCalled, true);
            });
        });
    });
});
