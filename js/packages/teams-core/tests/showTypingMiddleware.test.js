const assert = require('assert');
const { ActivityTypes, ShowTypingMiddleware, TestAdapter, TurnContext } = require('../lib');

class TestSkillAdapter extends TestAdapter {
    createContext(request) {
        const context = new TurnContext(this, request);

        context.turnState.set(context.adapter.BotIdentityKey, {
            claims: [
                { type: 'ver', value: '2.0' },
                { type: 'aud', value: 'skill' },
                { type: 'azp', value: 'bot' },
            ],
        });

        return context;
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('ShowTypingMiddleware', function () {
    this.timeout(10000);

    const adapter = new TestAdapter(async (context) => {
        await sleep(600);
        await context.sendActivity(`echo:${context.activity.text}`);
    }).use(new ShowTypingMiddleware());

    it('should automatically send a typing indicator', async function () {
        await adapter
            .send('foo')
            .assertReply((activity) => assert.strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:foo')
            .send('bar')
            .assertReply((activity) => assert.strictEqual(activity.type, ActivityTypes.Typing))
            .assertReply('echo:bar')
            .startTest();
    });

    const noMiddlewareAdapter = new TestAdapter(async (context) => {
        await context.sendActivity(`echo:${context.activity.text}`);
    });

    it('should NOT automatically send a typing indicator if middleware not applied', async function () {
        await noMiddlewareAdapter.send('foo').assertReply('echo:foo').startTest();
    });

    it('should not immediately respond with a message (rather get a typing indicator)', async function () {
        await adapter
            .send('foo')
            .assertReply((activity) => assert.notStrictEqual(activity.type, ActivityTypes.Message))
            .startTest();
    });

    it('should immediately respond with a message (rather get a typing indicator) if middleware not applied', async function () {
        await noMiddlewareAdapter
            .send('foo')
            .assertReply((activity) => assert.strictEqual(activity.type, ActivityTypes.Message))
            .startTest();
    });

    it('should not emit an uncaught exception when a promise is rejected', async function () {
        class ShowTypingErrorMiddleware extends ShowTypingMiddleware {
            async sendTypingActivity() {
                throw new Error('uh oh');
            }
        }

        const adapter = new TestAdapter(async (context) => {
            await sleep(100);
            await context.sendActivity(`echo:${context.activity.text}`);
        }).use(new ShowTypingErrorMiddleware(1, 1000));

        adapter.onTurnError = (context, error) => {
            assert.strictEqual(error != null, true);
            assert.strictEqual(error.message, 'uh oh');
        };

        await adapter.send('foo').assertReply((activity) => assert.strictEqual(activity.type, ActivityTypes.Message));
    });

    it('should NOT send a typing indicator when bot is running as a skill', async function () {
        const skillAdapter = new TestSkillAdapter(async (context) => {
            await sleep(100);
            await context.sendActivity(`echo:${context.activity.text}`);
        }).use(new ShowTypingMiddleware(1, 1000));

        await skillAdapter.send('foo').assertReply('echo:foo').startTest();
    });
});
