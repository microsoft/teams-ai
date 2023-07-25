const assert = require('assert');
const { CardFactory } = require('../');

function assertAttachment(attachment, contentType) {
    assert(attachment, 'attachment not created.');
    assert(attachment.contentType === contentType, 'attachment has wrong contentType.');
    assert(attachment.content, 'attachment missing content.');
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

function assertImages(images, count, links) {
    assert(Array.isArray(images), 'images not array.');
    assert(images.length === count, 'wrong number of images returned.');
    for (let i = 0; i < count; i++) {
        assert(images[i].url, `image url[${i}] missing`);
        if (links) {
            assert(images[i].url === links[i], `image url[${i}] invalid`);
        }
    }
}

function assertMedia(media, count, links) {
    assert(Array.isArray(media), 'media not array.');
    assert(media.length === count, 'wrong number of media returned.');
    for (let i = 0; i < count; i++) {
        assert(media[i].url, `media url[${i}] missing`);
        if (links) {
            assert(media[i].url === links[i], `media url[${i}] invalid`);
        }
    }
}

function assertOAuthActions(actions, title) {
    assert(Array.isArray(actions), 'received actions is not an array.');
    assert(actions.length === 1, 'should have received only one action.');
    const button = actions[0];
    assert(button.value === undefined, "OAuthCard actions' value should be undefined.");
    assert(button.title === title, `action's title [${button.title}] is not expected "${title}".`);
    assert(button.type === 'signin', `action's type [${button.type}] is not expected "signin".`);
}

describe('CardFactory', function () {
    this.timeout(5000);

    it('should map array of strings passed to actions() to CardAction objects.', function () {
        const actions = CardFactory.actions(['a', 'b', 'c']);
        assertActions(actions, 3, ['a', 'b', 'c']);
    });

    it('should support an array of CardAction options passed to actions().', function () {
        const actions = CardFactory.actions([
            {
                title: 'foo',
                type: 'postBack',
                value: 'bar',
            },
        ]);
        assertActions(actions, 1, ['foo']);
        assert(actions[0].type === 'postBack', 'invalid action type');
        assert(actions[0].value === 'bar', 'invalid action value.');
    });

    it("should support a 'undefined' actions array passed to actions().", function () {
        const actions = CardFactory.actions(undefined);
        assertActions(actions, 0);
    });

    it('should map array of strings passed to images() to CardImage objects.', function () {
        const images = CardFactory.images(['a', 'b', 'c']);
        assertImages(images, 3, ['a', 'b', 'c']);
    });

    it('should support an array of CardImage options passed to images().', function () {
        const images = CardFactory.images([
            {
                url: 'foo',
                alt: 'bar',
                tap: {},
            },
        ]);
        assertImages(images, 1, ['foo']);
        assert(images[0].alt === 'bar', 'invalid image.alt property.');
        assert(typeof images[0].tap === 'object', 'invalid image.type property.');
    });

    it("should support a 'undefined' images array passed to images().", function () {
        const images = CardFactory.images(undefined);
        assertImages(images, 0);
    });

    it('should map array of strings passed to media() to CardMedia objects.', function () {
        const media = CardFactory.media(['a', 'b', 'c']);
        assertMedia(media, 3, ['a', 'b', 'c']);
    });

    it('should support an array of CardMedia options passed to media().', function () {
        const media = CardFactory.media([
            {
                url: 'foo',
                profile: 'bar',
            },
        ]);
        assertMedia(media, 1, ['foo']);
        assert(media[0].profile === 'bar', 'invalid media.profile property.');
    });

    it("should support a 'undefined' media array passed to media().", function () {
        const media = CardFactory.media(undefined);
        assertMedia(media, 0);
    });

    it('should create an adaptiveCard().', function () {
        const attachment = CardFactory.adaptiveCard({ type: 'AdaptiveCard' });
        assertAttachment(attachment, CardFactory.contentTypes.adaptiveCard);
        assert(attachment.content.type, 'wrong content.');
    });

    it('should create an animationCard().', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.animationCard('foo', links);
        assertAttachment(attachment, CardFactory.contentTypes.animationCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assertMedia(content.media, 1, links);
    });

    it('should create an animationCard() with buttons.', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.animationCard('foo', links, ['a', 'b', 'c']);
        assertAttachment(attachment, CardFactory.contentTypes.animationCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assertMedia(content.media, 1, links);
        assertActions(content.buttons, 3, ['a', 'b', 'c']);
    });

    it('should create an animationCard() with other fields.', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.animationCard('foo', links, undefined, { text: 'bar' });
        assertAttachment(attachment, CardFactory.contentTypes.animationCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assert(content.text === 'bar', 'missing or invalid other fields.');
        assertMedia(content.media, 1, links);
    });

    it('should create an animationCard() with no title.', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.animationCard(undefined, links);
        assertAttachment(attachment, CardFactory.contentTypes.animationCard);
        const content = attachment.content;
        assert(content.title === undefined, 'wrong title.');
        assertMedia(content.media, 1, links);
    });

    it('should create an audioCard().', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.audioCard('foo', links);
        assertAttachment(attachment, CardFactory.contentTypes.audioCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assertMedia(content.media, 1, links);
    });

    it('should create an audioCard() with buttons.', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.audioCard('foo', links, ['a', 'b', 'c']);
        assertAttachment(attachment, CardFactory.contentTypes.audioCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assertMedia(content.media, 1, links);
        assertActions(content.buttons, 3, ['a', 'b', 'c']);
    });

    it('should create an audioCard() with other fields.', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.audioCard('foo', links, undefined, { text: 'bar' });
        assertAttachment(attachment, CardFactory.contentTypes.audioCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assert(content.text === 'bar', 'missing or invalid other fields.');
        assertMedia(content.media, 1, links);
    });

    it('should create an videoCard().', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.videoCard('foo', links);
        assertAttachment(attachment, CardFactory.contentTypes.videoCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assertMedia(content.media, 1, links);
    });

    it('should create an videoCard() with buttons.', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.videoCard('foo', links, ['a', 'b', 'c']);
        assertAttachment(attachment, CardFactory.contentTypes.videoCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assertMedia(content.media, 1, links);
        assertActions(content.buttons, 3, ['a', 'b', 'c']);
    });

    it('should create an videoCard() with other fields.', function () {
        const links = ['https://example.org/media'];
        const attachment = CardFactory.videoCard('foo', links, undefined, { text: 'bar' });
        assertAttachment(attachment, CardFactory.contentTypes.videoCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assert(content.text === 'bar', 'missing or invalid other fields.');
        assertMedia(content.media, 1, links);
    });

    it('should create a heroCard().', function () {
        const attachment = CardFactory.heroCard('foo');
        assertAttachment(attachment, CardFactory.contentTypes.heroCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
    });

    it('should create a thumbnailCard().', function () {
        const attachment = CardFactory.thumbnailCard('foo');
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
    });

    it('should create a thumbnailCard() with images.', function () {
        const links = ['https://example.org/image'];
        const attachment = CardFactory.thumbnailCard('foo', links);
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assertImages(content.images, 1, links);
    });

    it('should create a thumbnailCard() with text.', function () {
        const attachment = CardFactory.thumbnailCard('foo', 'bar');
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assert(content.text === 'bar', 'wrong text.');
    });

    it('should create a thumbnailCard() with text and images.', function () {
        const links = ['https://example.org/image'];
        const attachment = CardFactory.thumbnailCard('foo', 'bar', links);
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assert(content.text === 'bar', 'wrong text.');
        assertImages(content.images, 1, links);
    });

    it('should create a thumbnailCard() with buttons.', function () {
        const attachment = CardFactory.thumbnailCard('foo', undefined, ['a', 'b', 'c']);
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assertActions(content.buttons, 3, ['a', 'b', 'c']);
    });

    it('should create a thumbnailCard() with buttons and no title.', function () {
        const attachment = CardFactory.thumbnailCard(undefined, undefined, ['a', 'b', 'c']);
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === undefined, 'wrong title.');
        assertActions(content.buttons, 3, ['a', 'b', 'c']);
    });

    it('should create a thumbnailCard() with text and buttons.', function () {
        const attachment = CardFactory.thumbnailCard('foo', 'bar', undefined, ['a', 'b', 'c']);
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assert(content.text === 'bar', 'wrong text.');
        assertActions(content.buttons, 3, ['a', 'b', 'c']);
    });

    it('should create a thumbnailCard() with other.', function () {
        const attachment = CardFactory.thumbnailCard('foo', undefined, undefined, { subtitle: 'sub' });
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assert(content.subtitle === 'sub', 'wrong subtitle.');
    });

    it('should create a thumbnailCard() with text and other.', function () {
        const attachment = CardFactory.thumbnailCard('foo', 'bar', undefined, undefined, { subtitle: 'sub' });
        assertAttachment(attachment, CardFactory.contentTypes.thumbnailCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong title.');
        assert(content.text === 'bar', 'wrong text.');
        assert(content.subtitle === 'sub', 'wrong subtitle.');
    });

    it('should create a receiptCard().', function () {
        const attachment = CardFactory.receiptCard({ title: 'foo' });
        assertAttachment(attachment, CardFactory.contentTypes.receiptCard);
        const content = attachment.content;
        assert(content.title === 'foo', 'wrong content.');
    });

    it('should create a signinCard().', function () {
        const attachment = CardFactory.signinCard('foo', 'https://example.org/signin');
        assertAttachment(attachment, CardFactory.contentTypes.signinCard);
        const content = attachment.content;
        assertActions(content.buttons, 1, ['foo']);
        assert(content.buttons[0].type === 'signin', 'wrong action type.');
        assert(content.buttons[0].value === 'https://example.org/signin', 'wrong action value.');
    });

    it('should create a signinCard() with text.', function () {
        const attachment = CardFactory.signinCard('foo', 'https://example.org/signin', 'bar');
        assertAttachment(attachment, CardFactory.contentTypes.signinCard);
        const content = attachment.content;
        assertActions(content.buttons, 1, ['foo']);
        assert(content.buttons[0].type === 'signin', 'wrong action type.');
        assert(content.buttons[0].value === 'https://example.org/signin', 'wrong action value.');
        assert(content.text === 'bar', 'wrong text.');
    });

    it('should create an OAuthCard with text.', function () {
        const attachment = CardFactory.oauthCard('ConnectionName', 'Test', 'Test-text');
        assertAttachment(attachment, CardFactory.contentTypes.oauthCard);
        const content = attachment.content;
        assertOAuthActions(content.buttons, 'Test');
        assert(content.text === 'Test-text', 'wrong text.');
        assert(content.connectionName === 'ConnectionName', 'wrong connectionName.');
    });

    it('should create an OAuthCard without text.', function () {
        const attachment = CardFactory.oauthCard('ConnectionName', 'Test');
        assertAttachment(attachment, CardFactory.contentTypes.oauthCard);
        const content = attachment.content;
        assertOAuthActions(content.buttons, 'Test');
        assert(content.text === undefined, 'text should not exist.');
        assert(content.connectionName === 'ConnectionName', 'wrong connectionName.');
    });

    it('should create an o365ConnectorCard.', function () {
        const attachment = CardFactory.o365ConnectorCard({
            title: 'card title',
            text: 'card text',
            summary: 'O365 card summary',
            themeColor: '#E67A9E',
            sections: [
                {
                    title: '**section title**',
                    text: 'section text',
                    activityTitle: 'activity title',
                },
            ],
        });
        assertAttachment(attachment, CardFactory.contentTypes.o365ConnectorCard);
        const content = attachment.content;
        assert(content.title === 'card title', 'wrong title.');
        assert(content.sections.length === 1, 'wrong sections count.');
        assert(content.potentialAction === undefined, 'potentialAction should not exist.');
    });
});
