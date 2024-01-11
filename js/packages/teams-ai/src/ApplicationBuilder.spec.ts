import { strict as assert } from 'assert';
import { MemoryStorage } from 'botbuilder';
import { PasswordServiceClientCredentialFactory } from 'botframework-connector';

import { ApplicationBuilder } from './ApplicationBuilder';
import { AdaptiveCardsOptions } from './AdaptiveCards';
import { AIOptions } from './AI';
import { TurnState } from './TurnState';
import { TestPlanner } from './planners';
import { TaskModulesOptions } from './TaskModules';
import { BotAdapterOptions } from './BotAdapterOptions';
import { TeamsBotFrameworkAuthentication } from './TeamsBotFrameworkAuthentication';

describe('ApplicationBuilder', () => {
    const botAppId = 'testBot';
    const adapter: BotAdapterOptions = {
        authentication: new TeamsBotFrameworkAuthentication({
            credentialsFactory: new PasswordServiceClientCredentialFactory('', '')
        })
    };

    const adaptiveCards: AdaptiveCardsOptions = { actionSubmitFilter: 'cardFilter' };
    const ai: AIOptions<TurnState> = { planner: new TestPlanner() };
    const longRunningMessages = true;
    const removeRecipientMention = false;
    const startTypingTimer = false;
    const storage = new MemoryStorage();
    const taskModules: TaskModulesOptions = { taskDataFilter: 'taskFilter' };
    const authenticationSettings = {
        settings: {
            testSetting: {
                connectionName: 'testConnectionName',
                title: 'testTitle'
            }
        }
    };

    it('should create an Application with default options', () => {
        const app = new ApplicationBuilder().build();
        assert.notEqual(app.options, undefined);
        assert.equal(app.options.adapter, undefined);
        assert.equal(app.options.storage, undefined);
        assert.equal(app.options.ai, undefined);
        assert.equal(app.options.authentication, undefined);
        assert.equal(app.options.adaptiveCards, undefined);
        assert.equal(app.options.taskModules, undefined);
        assert.equal(app.options.removeRecipientMention, true);
        assert.equal(app.options.startTypingTimer, true);
        assert.equal(app.options.longRunningMessages, false);
    });

    it('should create an Application with custom options', () => {
        const app = new ApplicationBuilder()
            .setRemoveRecipientMention(removeRecipientMention)
            .withStorage(storage)
            .withAIOptions(ai)
            .withLongRunningMessages(adapter, botAppId)
            .withAdaptiveCardOptions(adaptiveCards)
            .withAuthentication(adapter, authenticationSettings)
            .withTaskModuleOptions(taskModules)
            .setStartTypingTimer(startTypingTimer)
            .build();
        assert.notEqual(app.options, undefined);
        assert.equal(app.options.adapter, adapter);
        assert.equal(app.options.storage, storage);
        assert.equal(app.options.ai, ai);
        assert.equal(app.options.adaptiveCards, adaptiveCards);
        assert.equal(app.options.authentication, authenticationSettings);
        assert.equal(app.options.taskModules, taskModules);
        assert.equal(app.options.removeRecipientMention, removeRecipientMention);
        assert.equal(app.options.startTypingTimer, startTypingTimer);
        assert.equal(app.options.longRunningMessages, longRunningMessages);
    });

    it('should throw an exception if botId is an empty string for longRunningMessages', () => {
        assert.throws(() => {
            new ApplicationBuilder().withLongRunningMessages(adapter, '').build();
        });
    });
});
