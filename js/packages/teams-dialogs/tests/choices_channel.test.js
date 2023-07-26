const assert = require('assert');
const { Channels } = require('botbuilder-core');
const { getChannelId, hasMessageFeed, supportsSuggestedActions, supportsCardActions } = require('../');

describe('channel methods', function () {
    this.timeout(5000);

    it('should return true for supportsSuggestedActions() with line and 13', function () {
        assert(supportsSuggestedActions(Channels.Line, 13));
    });

    it('should return false for supportsSuggestedActions() with line and 14', function () {
        assert.strictEqual(supportsSuggestedActions(Channels.Line, 14), false);
    });

    it('should return true for supportsSuggestedActions() with skype and 10', function () {
        assert(supportsSuggestedActions(Channels.Skype, 10));
    });

    it('should return false for supportsSuggestedActions() with skype and 11', function () {
        assert.strictEqual(supportsSuggestedActions(Channels.Skype, 11), false);
    });

    it('should return true for supportsSuggestedActions() with kik and 20', function () {
        assert(supportsSuggestedActions(Channels.Kik, 20));
    });

    it('should return false for supportsSuggestedActions() with kik and 21', function () {
        assert.strictEqual(supportsSuggestedActions(Channels.Kik, 21), false);
    });

    it('should return true for supportsSuggestedActions() with emulator and 100', function () {
        assert(supportsSuggestedActions(Channels.Emulator, 100));
    });

    it('should return false for supportsSuggestedActions() with emulator and 101', function () {
        assert.strictEqual(supportsSuggestedActions(Channels.Emulator, 101), false);
    });

    it('should return true for supportsCardActions() with line and 99', function () {
        assert(supportsCardActions(Channels.Line, 99));
    });

    it('should return false for supportsCardActions() with line and 100', function () {
        assert.strictEqual(supportsCardActions(Channels.Line, 100), false);
    });

    it('should return false for supportsCardActions() with slack and 101', function () {
        assert.strictEqual(supportsCardActions(Channels.Slack, 101), false);
    });

    it('should return true for supportsCardActions() with skype and 3', function () {
        assert(supportsCardActions(Channels.Skype, 3));
    });

    it('should return false for supportsCardActions() with skype and 5', function () {
        assert.strictEqual(supportsCardActions(Channels.Skype, 5), false);
    });

    it('should return true for supportsCardActions() with teams and 50', function () {
        assert.strictEqual(supportsCardActions(Channels.Msteams, 50), true);
    });

    it('should return false for supportsCardActions() with teams and 51', function () {
        assert.strictEqual(supportsCardActions(Channels.Msteams, 51), false);
    });

    it('should return the channelId from context.activity.', function () {
        assert.strictEqual(getChannelId({ activity: { channelId: Channels.Facebook } }), Channels.Facebook);
    });

    it('should return true for any channel', function () {
        assert(hasMessageFeed(Channels.Directline));
    });

    it('should return an empty string if context.activity.channelId is falsey.', function () {
        assert.strictEqual(getChannelId({ activity: {} }), '');
    });

    // "directlinespeech" tests
    it('should return true for supportsSuggestedActions() with directlinespeech and 100', function () {
        assert(supportsSuggestedActions(Channels.DirectlineSpeech, 100));
    });

    it('should return true for supportsCardActions() with directlinespeech and 100', function () {
        assert(supportsCardActions(Channels.DirectlineSpeech, 100));
    });
});
