const assert = require('assert');
const {
    ActivityTypes,
    AutoSaveStateMiddleware,
    ConversationState,
    InputHints,
    MemoryStorage,
    MessageFactory,
    SkillConversationReferenceKey,
    TestAdapter,
    UserState,
} = require('botbuilder-core');
const { ComponentDialog, DialogReason, runDialog, TextPrompt, WaterfallDialog } = require('../');
const { AuthenticationConstants } = require('botframework-connector');
const { EndOfConversationCodes } = require('botbuilder-core');

const FlowTestCase = {
    RootBotOnly: 'RootBotOnly',
    RootBotConsumingSkill: 'RootBotConsumingSkill',
    MiddleSkill: 'MiddleSkill',
    LeafSkill: 'LeafSkill',
};

class ClaimsIdentity {
    constructor(claims = [], isAuthenticated = true) {
        this.claims = claims;
        this.isAuthenticated = isAuthenticated;
    }
    /**
     * Returns a claim value (if its present)
     *
     * @param  {string} claimType The claim type to look for
     * @returns {string|null} The claim value or null if not found
     */
    getClaimValue(claimType) {
        const claim = this.claims.find((c) => c.type === claimType);
        return claim ? claim.value : null;
    }

    addClaim(claim) {
        this.claims.push(claim);
    }
}

const PARENT_BOT_ID = '00000000-0000-0000-0000-0000000000PARENT';
const SKILL_BOT_ID = '00000000-0000-0000-0000-00000000000SKILL';
let _eocSent;

function createTestFlow(dialog, testCase) {
    const conversationId = 'testFlowConversationId';
    const storage = new MemoryStorage();
    const convoState = new ConversationState(storage);
    const userState = new UserState(storage);

    const convRef = {
        channelId: 'test',
        serviceUrl: 'https://test.com',
        from: { id: 'user1', name: 'User1' },
        recipient: { id: 'bot', name: 'Bot' },
        conversation: {
            isGroup: false,
            conversationType: conversationId,
            id: conversationId,
        },
    };

    const adapter = new TestAdapter(async (context) => {
        if (testCase !== FlowTestCase.RootBotOnly) {
            // Create a skill ClaimsIdentity and put it in turnState so isSkillClaim() returns true.
            const claimsIdentity = new ClaimsIdentity();
            claimsIdentity.addClaim({ type: 'ver', value: '2.0' }); // AuthenticationConstants.VersionClaim
            claimsIdentity.addClaim({ type: 'aud', value: SKILL_BOT_ID }); // AuthenticationConstants.AudienceClaim
            claimsIdentity.addClaim({ type: 'azp', value: PARENT_BOT_ID }); // AuthenticationConstants.AuthorizedParty
            context.turnState.set(context.adapter.BotIdentityKey, claimsIdentity);

            if (testCase === FlowTestCase.RootBotConsumingSkill) {
                // Simulate the SkillConversationReference with a channel OAuthScope stored in turnState.
                // This emulates a response coming to a root bot through SkillHandler.
                context.turnState.set(SkillConversationReferenceKey, {
                    oAuthScope: AuthenticationConstants.ToBotFromChannelTokenIssuer,
                });
            }

            if (testCase === FlowTestCase.MiddleSkill) {
                // Simulate the SkillConversationReference with a parent Bot ID stored in turnState.
                // This emulates a response coming to a skill from another skill through SkillHandler.
                context.turnState.set(SkillConversationReferenceKey, { oAuthScope: PARENT_BOT_ID });
            }
        }

        // Interceptor to capture the EoC activity if it was sent so we can assert it in the tests.
        context.onSendActivities(async (_tc, activities, next) => {
            for (let idx = 0; idx < activities.length; idx++) {
                if (activities[idx].type === ActivityTypes.EndOfConversation) {
                    _eocSent = activities[idx];
                    break;
                }
            }
            return await next();
        });

        // Invoke runDialog on the dialog.
        await runDialog(dialog, context, convoState.createProperty('DialogState'));
    }, convRef);
    adapter.use(new AutoSaveStateMiddleware(userState, convoState));

    return adapter;
}

class SimpleComponentDialog extends ComponentDialog {
    constructor() {
        super('SimpleComponentDialog');
        this.TextPrompt = 'TextPrompt';
        this.WaterfallDialog = 'WaterfallDialog';
        this.addDialog(new TextPrompt(this.TextPrompt));
        this.addDialog(
            new WaterfallDialog(this.WaterfallDialog, [this.promptForName.bind(this), this.finalStep.bind(this)])
        );
        this.initialDialogId = this.WaterfallDialog;
        this.endReason;
    }

    async onEndDialog(context, instance, reason) {
        this.endReason = reason;
        return super.onEndDialog(context, instance, reason);
    }

    async promptForName(step) {
        return step.prompt(this.TextPrompt, {
            prompt: MessageFactory.text('Hello, what is your name?', undefined, InputHints.ExpectingInput),
            retryPrompt: MessageFactory.text('Hello, what is your name again?', undefined, InputHints.ExpectingInput),
        });
    }

    async finalStep(step) {
        await step.context.sendActivity(`Hello ${step.result}, nice to meet you!`);
        return step.endDialog(step.result);
    }
}

class ComponentDialogWithPrematureEnd extends ComponentDialog {
    constructor() {
        super('ComponentDialogWithPrematureEnd');
        const waterfallDialog = 'waterfallDialog';
        this.addDialog(new WaterfallDialog(waterfallDialog, [this.finalStep.bind(this)]));
        this.initialDialogId = waterfallDialog;
        this.endReason;
    }

    async onEndDialog(context, instance, reason) {
        this.endReason = reason;
        return super.onEndDialog(context, instance, reason);
    }

    async finalStep(step) {
        return step.endDialog();
    }
}

class ComponentDialogWithCancellation extends ComponentDialog {
    constructor() {
        super('ComponentDialogWithCancellation');
        const waterfallDialog = 'waterfallDialog';
        this.addDialog(new WaterfallDialog(waterfallDialog, [this.finalStep.bind(this)]));
        this.initialDialogId = waterfallDialog;
        this.endReason;
    }

    async onEndDialog(context, instance, reason) {
        this.endReason = reason;
        return super.onEndDialog(context, instance, reason);
    }

    async finalStep(step) {
        return step.cancelAllDialogs(true);
    }
}

describe('runDialog()', function () {
    this.timeout(300);

    describe('parameter validation', function () {
        it('should throw if missing dialog parameter', async function () {
            await assert.rejects(async () => runDialog(), {
                message: 'runDialog(): missing dialog',
            });
        });

        it('should throw if missing context parameter', async function () {
            await assert.rejects(async () => runDialog({}), {
                message: 'runDialog(): missing context',
            });
        });

        it('should throw if missing context.activity', async function () {
            await assert.rejects(async () => runDialog({}, {}), {
                message: 'runDialog(): missing context.activity',
            });
        });

        it('should throw if missing accessor parameter', async function () {
            await assert.rejects(async () => runDialog({}, { activity: {} }), {
                message: 'runDialog(): missing accessor',
            });
        });
    });

    describe('HandlesBotAndSkillsTestCases', function () {
        this.beforeEach(() => {
            _eocSent = undefined;
        });

        async function handlesBotAndSkillsTestCases(testCase, shouldSendEoc) {
            const dialog = new SimpleComponentDialog();
            const testFlow = createTestFlow(dialog, testCase);
            await testFlow
                .send('Hi')
                .assertReply('Hello, what is your name?')
                .send('SomeName')
                .assertReply('Hello SomeName, nice to meet you!')
                .startTest();

            assert.strictEqual(dialog.endReason, DialogReason.endCalled);
            if (shouldSendEoc) {
                assert.ok(_eocSent, 'Skills should send EndConversation to channel');
                assert.strictEqual(_eocSent.type, ActivityTypes.EndOfConversation);
                assert.strictEqual(_eocSent.value, 'SomeName');
                assert.strictEqual(_eocSent.code, EndOfConversationCodes.CompletedSuccessfully);
            } else {
                assert.strictEqual(undefined, _eocSent, 'Root bot should not send EndConversation to channel');
            }
        }

        it('rootBotOnly, no sent EoC', async function () {
            await handlesBotAndSkillsTestCases(FlowTestCase.RootBotOnly, false);
        });

        it('rootBotConsumingSkill, no sent EoC', async function () {
            await handlesBotAndSkillsTestCases(FlowTestCase.RootBotConsumingSkill, false);
        });

        it('middleSkill, sent EoC', async function () {
            await handlesBotAndSkillsTestCases(FlowTestCase.MiddleSkill, true);
        });

        it('leafSkill, sent EoC', async function () {
            await handlesBotAndSkillsTestCases(FlowTestCase.LeafSkill, true);
        });
    });

    describe('HandlesEarlyDialogEndings', function () {
        it('handles premature dialog ending', async function () {
            const dialog = new ComponentDialogWithPrematureEnd();
            const testFlow = createTestFlow(dialog, FlowTestCase.MiddleSkill);
            await testFlow.send('Hi').startTest();

            assert.strictEqual(dialog.endReason, DialogReason.endCalled);
            assert.ok(_eocSent, 'Skills should send EndConversation to channel');
            assert.strictEqual(_eocSent.type, ActivityTypes.EndOfConversation);
            assert.strictEqual(_eocSent.code, EndOfConversationCodes.CompletedSuccessfully);
        });
        it('handles premature dialog cancellation', async function () {
            const dialog = new ComponentDialogWithCancellation();
            const testFlow = createTestFlow(dialog, FlowTestCase.MiddleSkill);
            await testFlow.send('Hi').startTest();

            assert.strictEqual(dialog.endReason, DialogReason.cancelCalled);
            assert.ok(_eocSent, 'Skills should send EndConversation to channel');
            assert.strictEqual(_eocSent.type, ActivityTypes.EndOfConversation);
            assert.strictEqual(_eocSent.code, EndOfConversationCodes.UserCancelled);
        });
    });
});
