import { strict as assert } from "assert";
import { TestAdapter, MemoryStorage, ActivityTypes } from "botbuilder";
import { Application } from "./Application";
import { TestPlanner } from "./TestPlanner";
import { TestPromptManager } from "./TestPromptManager";
import { AdaptiveCardsOptions } from "./AdaptiveCards";
import { AIOptions } from "./AI";
import { DefaultTurnState, DefaultTurnStateManager } from "./DefaultTurnStateManager";
import { TaskModulesOptions } from "./TaskModules";

describe("Application", () => {
    const adapter = new TestAdapter();
    const adaptiveCards: AdaptiveCardsOptions = { actionSubmitFilter: 'cardFilter' };
    const ai: AIOptions<DefaultTurnState> = {
        planner: new TestPlanner(),
        promptManager: new TestPromptManager()
    };
    const botAppId = 'testBot';
    const longRunningMessages = true;
    const removeRecipientMention = false;
    const startTypingTimer = false;
    const storage = new MemoryStorage();
    const taskModules: TaskModulesOptions = { taskDataFilter: 'taskFilter' };
    const turnStateManager = new DefaultTurnStateManager();

    describe("constructor()", () => {
        it("should create an Application with default options", () => {
            const app = new Application();
            assert.notEqual(app.options, undefined);
            assert.equal(app.options.adapter, undefined);
            assert.equal(app.options.adaptiveCards, undefined);
            assert.equal(app.options.ai, undefined);
            assert.equal(app.options.botAppId, undefined);
            assert.equal(app.options.longRunningMessages, false);
            assert.equal(app.options.removeRecipientMention, true);
            assert.equal(app.options.startTypingTimer, true);
            assert.equal(app.options.storage, undefined);
            assert.equal(app.options.taskModules, undefined);
            assert.notEqual(app.options.turnStateManager, undefined);
        });

        it("should create an Application with custom options", () => {
            const app = new Application({
                adapter,
                adaptiveCards,
                ai,
                botAppId,
                longRunningMessages,
                removeRecipientMention,
                startTypingTimer,
                storage,
                taskModules,
                turnStateManager
            });
            assert.notEqual(app.options, undefined);
            assert.equal(app.options.adapter, adapter);
            assert.deepEqual(app.options.adaptiveCards, adaptiveCards);
            assert.deepEqual(app.options.ai, ai);
            assert.equal(app.options.botAppId, botAppId);
            assert.equal(app.options.longRunningMessages, longRunningMessages);
            assert.equal(app.options.removeRecipientMention, removeRecipientMention);
            assert.equal(app.options.startTypingTimer, startTypingTimer);
            assert.equal(app.options.storage, storage);
            assert.deepEqual(app.options.taskModules, taskModules);
            assert.equal(app.options.turnStateManager, turnStateManager);
        });
    });

    describe("adaptiveCards", () => {
        it("should return the adaptiveCards property", () => {
            const app = new Application();
            assert.notEqual(app.adaptiveCards, undefined);
        });
    });

    describe("ai", () => {
        it("should throw exception if ai not configured", () => {
            const app = new Application();
            assert.throws(() => app.ai);
        });

        it("should return the ai property", () => {
            const app = new Application({
                ai
            });
            assert.notEqual(app.ai, undefined);
        });
    });

    describe("messageExtensions", () => {
        it("should return the messageExtensions property", () => {
            const app = new Application();
            assert.notEqual(app.messageExtensions, undefined);
        });
    });

    describe("taskModules", () => {
        it("should return the taskModules property", () => {
            const app = new Application();
            assert.notEqual(app.taskModules, undefined);
        });
    });

    describe("activity", () => {
        it("should route to an activity handler", async () => {
            let called = false;
            const app = new Application();
            app.activity(ActivityTypes.Message, async (context, state) => {
                assert.notEqual(context, undefined);
                assert.notEqual(state, undefined);
                called = true;
            });

            await adapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(called, true);
                assert.equal(handled, true);
            });
        });

        it("should not route activity if there's no handler", async () => {
            const app = new Application();
            await adapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(handled, false);
            });
        });

        it("should route to first registered activity handler", async () => {
            let called = false;
            const app = new Application();
            app.activity(ActivityTypes.Message, async (context, state) => {
                called = true;
            });
            app.activity(ActivityTypes.Message, async (context, state) => {
                assert.fail('should not be called');
            });

            await adapter.sendTextToBot('test', async (context) => {
                const handled = await app.run(context);
                assert.equal(called, true);
                assert.equal(handled, true);
            });
        });

    });
});