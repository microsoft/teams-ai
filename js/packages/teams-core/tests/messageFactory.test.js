const assert = require('assert');
const { MessageFactory, InputHints, AttachmentLayoutTypes } = require('../');

function assertMessage(activity) {
    assert(typeof activity === 'object', 'invalid activity returned.');
    assert(activity.type === 'message', 'not a message activity.');
}

function assertActions(actions, count, titles) {
    assert(Array.isArray(actions), 'actions not array.');
    assert(actions.length === count, 'wrong number of actions returned.');
    for (let i = 0; i < count; i++) {
        assert(actions[i].title, `title[${i}] missing`);
        if (titles) {
            assert(actions[i].title === titles[i], `title[${i}] invalid`);
        }
        assert(actions[i].type, `type[${i}] missing`);
        assert(actions[i].value, `value[${i}] missing`);
    }
}

function assertAttachments(activity, count, types) {
    assert(Array.isArray(activity.attachments), 'no attachments array.');
    assert(activity.attachments.length === count, 'wrong number of attachments.');
    if (types) {
        for (let i = 0; i < count; i++) {
            assert(activity.attachments[i].contentType === types[i], `attachment[${i}] has invalid contentType.`);
        }
    }
}

describe('MessageFactory', function () {
    this.timeout(5000);

    it('should return a simple text() Activity.', function () {
        const activity = MessageFactory.text('foo');
        assertMessage(activity);
        assert(activity.text === 'foo', 'invalid text field.');
    });

    it('should return a simple text() Activity with text and speak.', function () {
        const activity = MessageFactory.text('foo', 'bar');
        assertMessage(activity);
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
    });

    it('should return a simple text() Activity with text, speak and inputHint.', function () {
        const activity = MessageFactory.text('foo', 'bar', InputHints.IgnoringInput);
        assertMessage(activity);
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
        assert(activity.inputHint === InputHints.IgnoringInput, 'invalid inputHint field.');
    });

    it('should return suggestedActions().', function () {
        const activity = MessageFactory.suggestedActions(['a', 'b', 'c']);
        assertMessage(activity);
        assert(activity.suggestedActions && activity.suggestedActions.actions, 'actions not returned');
        assertActions(activity.suggestedActions.actions, 3, ['a', 'b', 'c']);
    });

    it('should return suggestedActions() with text.', function () {
        const activity = MessageFactory.suggestedActions(['a', 'b', 'c'], 'foo');
        assertMessage(activity);
        assert(activity.suggestedActions && activity.suggestedActions.actions, 'actions not returned');
        assertActions(activity.suggestedActions.actions, 3, ['a', 'b', 'c']);
        assert(activity.text === 'foo', 'invalid text field.');
    });

    it('should return suggestedActions() with text and speak.', function () {
        const activity = MessageFactory.suggestedActions(['a', 'b', 'c'], 'foo', 'bar');
        assertMessage(activity);
        assert(activity.suggestedActions && activity.suggestedActions.actions, 'actions not returned');
        assertActions(activity.suggestedActions.actions, 3, ['a', 'b', 'c']);
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
    });

    it('should return suggestedActions() with text, speak, and inputHint.', function () {
        const activity = MessageFactory.suggestedActions(['a', 'b', 'c'], 'foo', 'bar', InputHints.IgnoringInput);
        assertMessage(activity);
        assert(activity.suggestedActions && activity.suggestedActions.actions, 'actions not returned');
        assertActions(activity.suggestedActions.actions, 3, ['a', 'b', 'c']);
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
        assert(activity.inputHint === InputHints.IgnoringInput, 'invalid inputHint field.');
    });

    it('should return attachment().', function () {
        const activity = MessageFactory.attachment({ contentType: 'none' });
        assertMessage(activity);
        assertAttachments(activity, 1, ['none']);
    });

    it('should return attachment() with text.', function () {
        const activity = MessageFactory.attachment({ contentType: 'none' }, 'foo');
        assertMessage(activity);
        assertAttachments(activity, 1, ['none']);
        assert(activity.text === 'foo', 'invalid text field.');
    });

    it('should return attachment() with text and speak.', function () {
        const activity = MessageFactory.attachment({ contentType: 'none' }, 'foo', 'bar');
        assertMessage(activity);
        assertAttachments(activity, 1, ['none']);
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
    });

    it('should return attachment() with text, speak, and inputHint.', function () {
        const activity = MessageFactory.attachment({ contentType: 'none' }, 'foo', 'bar', InputHints.IgnoringInput);
        assertMessage(activity);
        assertAttachments(activity, 1, ['none']);
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
        assert(activity.inputHint === InputHints.IgnoringInput, 'invalid inputHint field.');
    });

    it('should return a list().', function () {
        const activity = MessageFactory.list([{ contentType: 'a' }, { contentType: 'b' }]);
        assertMessage(activity);
        assertAttachments(activity, 2, ['a', 'b']);
        assert(activity.attachmentLayout === AttachmentLayoutTypes.List, 'invalid attachmentLayout.');
    });

    it('should return list() with text, speak, and inputHint.', function () {
        const activity = MessageFactory.list(
            [{ contentType: 'a' }, { contentType: 'b' }],
            'foo',
            'bar',
            InputHints.IgnoringInput
        );
        assertMessage(activity);
        assertAttachments(activity, 2, ['a', 'b']);
        assert(activity.attachmentLayout === AttachmentLayoutTypes.List, 'invalid attachmentLayout.');
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
        assert(activity.inputHint === InputHints.IgnoringInput, 'invalid inputHint field.');
    });

    it('should return a carousel().', function () {
        const activity = MessageFactory.carousel([{ contentType: 'a' }, { contentType: 'b' }]);
        assertMessage(activity);
        assertAttachments(activity, 2, ['a', 'b']);
        assert(activity.attachmentLayout === AttachmentLayoutTypes.Carousel, 'invalid attachmentLayout.');
    });

    it('should return carousel() with text, speak, and inputHint.', function () {
        const activity = MessageFactory.carousel(
            [{ contentType: 'a' }, { contentType: 'b' }],
            'foo',
            'bar',
            InputHints.IgnoringInput
        );
        assertMessage(activity);
        assertAttachments(activity, 2, ['a', 'b']);
        assert(activity.attachmentLayout === AttachmentLayoutTypes.Carousel, 'invalid attachmentLayout.');
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
        assert(activity.inputHint === InputHints.IgnoringInput, 'invalid inputHint field.');
    });

    it('should return a contentUrl().', function () {
        const activity = MessageFactory.contentUrl('https://example.com/content', 'content-type');
        assertMessage(activity);
        assertAttachments(activity, 1, ['content-type']);
        assert(
            activity.attachments[0].contentUrl === 'https://example.com/content',
            'invalid attachment[0].contentUrl.'
        );
    });

    it('should return a contentUrl() with a name.', function () {
        const activity = MessageFactory.contentUrl('https://example.com/content', 'content-type', 'file name');
        assertMessage(activity);
        assertAttachments(activity, 1, ['content-type']);
        assert(
            activity.attachments[0].contentUrl === 'https://example.com/content',
            'invalid attachment[0].contentUrl.'
        );
        assert(activity.attachments[0].name === 'file name', 'invalid attachment[0].name.');
    });

    it('should return a contentUrl() with a name, text, speak, and inputHint.', function () {
        const activity = MessageFactory.contentUrl(
            'https://example.com/content',
            'content-type',
            'file name',
            'foo',
            'bar',
            InputHints.IgnoringInput
        );
        assertMessage(activity);
        assertAttachments(activity, 1, ['content-type']);
        assert(
            activity.attachments[0].contentUrl === 'https://example.com/content',
            'invalid attachment[0].contentUrl.'
        );
        assert(activity.attachments[0].name === 'file name', 'invalid attachment[0].name.');
        assert(activity.text === 'foo', 'invalid text field.');
        assert(activity.speak === 'bar', 'invalid speak field.');
        assert(activity.inputHint === InputHints.IgnoringInput, 'invalid inputHint field.');
    });
});
