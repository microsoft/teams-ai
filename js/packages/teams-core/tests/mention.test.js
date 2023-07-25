const assert = require('assert');
const { MessageFactory, SkypeMentionNormalizeMiddleware, TurnContext } = require('../lib');

describe('Mention', function () {
    this.timeout(5000);

    it('should not change activity text when entity type is not a mention', async function () {
        const mentionJson =
            '{"mentioned": {"id": "recipientid"},"text": "<at id=\\"28: 841caffa-9e92-425d-8d84-b503b3ded285\\">botname</at>"}';
        const entity = JSON.parse(mentionJson);
        entity.type = 'test';

        const activity = MessageFactory.text('botname sometext');
        activity.channelId = 'skype';
        activity.entities = [entity];

        SkypeMentionNormalizeMiddleware.normalizeSkypeMentionText(activity);
        TurnContext.removeMentionText(activity, 'recipientid');
        assert(activity.text === 'botname sometext');
    });

    it('should not change activity text when mention text is empty', async function () {
        const mentionJson = '{"mentioned": {"id": "recipientid"},"text": ""}';
        const entity = JSON.parse(mentionJson);
        entity.type = 'mention';

        const activity = MessageFactory.text('botname sometext');
        activity.channelId = 'skype';
        activity.entities = [entity];

        SkypeMentionNormalizeMiddleware.normalizeSkypeMentionText(activity);
        TurnContext.removeMentionText(activity, 'recipientid');
        assert(activity.text === 'botname sometext');
    });

    it('should not change activity text when there is no matching mention', async function () {
        const mentionJson = '{"mentioned": {"id": "foo bar"},"text": ""}';
        const entity = JSON.parse(mentionJson);
        entity.type = 'mention';

        const activity = MessageFactory.text('botname sometext');
        activity.channelId = 'skype';
        activity.entities = [entity];

        SkypeMentionNormalizeMiddleware.normalizeSkypeMentionText(activity);
        TurnContext.removeMentionText(activity, 'recipientid');
        assert(activity.text === 'botname sometext');
    });

    it('should remove skype mention', async function () {
        const mentionJson =
            '{"mentioned": {"id": "recipientid"},"text": "<at id=\\"28: 841caffa-9e92-425d-8d84-b503b3ded285\\">botname</at>"}';
        const entity = JSON.parse(mentionJson);
        entity.type = 'mention';

        const activity = MessageFactory.text('botname sometext');
        activity.channelId = 'skype';
        activity.entities = [entity];

        SkypeMentionNormalizeMiddleware.normalizeSkypeMentionText(activity);
        TurnContext.removeMentionText(activity, 'recipientid');

        assert(activity.text === 'sometext');
    });

    it('should remove teams mention', async function () {
        const mentionJson = '{"mentioned": {"id": "recipientid"},"text": "<at>botname</at>"}';
        const entity = JSON.parse(mentionJson);
        entity.type = 'mention';

        const activity = MessageFactory.text('<at>botname</at> sometext');
        activity.channelId = 'teams';
        activity.entities = [entity];

        TurnContext.removeMentionText(activity, 'recipientid');

        assert(activity.text === 'sometext');
    });

    it('should remove slack mention', async function () {
        const mentionJson = '{"mentioned": {"id": "recipientid"},"text": "@botname"}';
        const entity = JSON.parse(mentionJson);
        entity.type = 'mention';

        const activity = MessageFactory.text('@botname sometext');
        activity.channelId = 'slack';
        activity.entities = [entity];

        TurnContext.removeMentionText(activity, 'recipientid');

        assert(activity.text === 'sometext');
    });

    it('should remove GroupMe mention', async function () {
        const mentionJson = '{"mentioned": {"id": "recipientid"},"text": "@bot name"}';
        const entity = JSON.parse(mentionJson);
        entity.type = 'mention';

        const activity = MessageFactory.text('@bot name sometext');
        activity.channelId = 'groupme';
        activity.entities = [entity];

        TurnContext.removeMentionText(activity, 'recipientid');

        assert(activity.text === 'sometext');
    });

    it('should remove Telegram mention', async function () {
        const mentionJson = '{"mentioned": {"id": "recipientid"},"text": "botname"}';
        const entity = JSON.parse(mentionJson);
        entity.type = 'mention';

        const activity = MessageFactory.text('botname sometext');
        activity.channelId = 'telegram';
        activity.entities = [entity];

        TurnContext.removeMentionText(activity, 'recipientid');

        assert(activity.text === 'sometext');
    });
});
