import { strict as assert } from 'assert';
import axios from 'axios';
import { Activity, Attachment, CallerIdConstants } from 'botbuilder';
import {
    AppCredentials,
    AuthenticatorResult,
    GovernmentConstants,
    PasswordServiceClientCredentialFactory
} from 'botframework-connector';
import sinon, { createSandbox } from 'sinon';

import { Application } from './Application';
import { TeamsAdapter } from './TeamsAdapter';
import { TeamsAttachmentDownloader } from './TeamsAttachmentDownloader';
import { createTestTurnContextAndState } from './internals/testing/TestUtilities';

describe('TeamsAttachmentDownloader', () => {
    const mockAxios = axios;

    let sinonSandbox: sinon.SinonSandbox;
    let createStub: sinon.SinonStub;
    let adapter: TeamsAdapter;
    let app: Application;
    let downloader: TeamsAttachmentDownloader;

    beforeEach(() => {
        sinonSandbox = createSandbox();
        createStub = sinonSandbox.stub(axios, 'create').returns(mockAxios);
        adapter = new TeamsAdapter({}, undefined, undefined, {});

        downloader = new TeamsAttachmentDownloader({
            botAppId: 'botAppId',
            adapter: adapter
        });

        app = new Application({
            adapter: adapter,
            fileDownloaders: [downloader]
        });
    });

    afterEach(() => {
        sinonSandbox.restore();
    });

    it('should be defined', () => {
        assert.doesNotThrow(() => app.adapter);
        console.log(createStub);
    });

    it('should download file', async () => {
        const postStub = sinonSandbox.stub(mockAxios, 'get').returns(Promise.resolve({ data: 'file.png' }));
        const attachment: Attachment = {
            contentUrl: 'https://example.com/file.png',
            contentType: 'image/png',
            name: 'file.png'
        };
        const activity = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        } as Partial<Activity>;
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await downloader.downloadFiles(context, state);

        assert.equal(postStub.calledOnce, true);

        assert.deepEqual(result, [
            {
                content: Buffer.from('file.png', 'binary'),
                contentType: 'image/png',
                contentUrl: 'https://example.com/file.png'
            }
        ]);
        assert.equal(createStub.called, true);
    });

    it('should receive local file', async () => {
        const postStub = sinonSandbox.stub(mockAxios, 'get').returns(Promise.resolve({ data: 'file.png' }));
        const attachment: Attachment = {
            contentUrl: 'http://localhost:3978/file.png',
            contentType: 'image/png',
            name: 'file.png'
        };
        const activity = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        } as Partial<Activity>;
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await downloader.downloadFiles(context, state);

        assert.equal(postStub.calledOnce, true);

        assert.deepEqual(result, [
            {
                content: Buffer.from('file.png', 'binary'),
                contentType: 'image/png',
                contentUrl: 'http://localhost:3978/file.png'
            }
        ]);
        assert.equal(createStub.called, true);
    });

    it('should receive local file and convert image/* to image/png contentType', async () => {
        const postStub = sinonSandbox.stub(mockAxios, 'get').returns(Promise.resolve({ data: 'file.png' }));
        const attachment: Attachment = {
            contentUrl: 'http://localhost:3978/file.png',
            contentType: 'image/*',
            name: 'file.png'
        };
        const activity = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        } as Partial<Activity>;
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await downloader.downloadFiles(context, state);

        assert.equal(postStub.calledOnce, true);

        assert.deepEqual(result, [
            {
                content: Buffer.from('file.png', 'binary'),
                contentType: 'image/png',
                contentUrl: 'http://localhost:3978/file.png'
            }
        ]);
        assert.equal(createStub.called, true);
    });

    it('should handle buffered attachment', async () => {
        const attachment: Attachment = {
            content: Buffer.from('file.png', 'binary'),
            contentType: 'image/png',
            name: 'file.png'
        };
        const activity = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        } as Partial<Activity>;
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await downloader.downloadFiles(context, state);

        assert.deepEqual(result, [
            {
                content: Buffer.from('file.png', 'binary'),
                contentType: 'image/png',
                contentUrl: undefined
            }
        ]);
    });

    it('should handle no attachments', async () => {
        const activity = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: []
        } as Partial<Activity>;
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await downloader.downloadFiles(context, state);

        assert.deepEqual(result, []);
    });

    class MockBFAppCredentials extends AppCredentials {
        constructor() {
            super('botAppId', 'botAppPassword');
        }
        getToken(_forceRefresh?: boolean): Promise<string> {
            return Promise.resolve('authToken');
        }

        protected refreshToken(): Promise<AuthenticatorResult> {
            throw new Error('Method not implemented.');
        }
    }
    class MockCredentialsFactory extends PasswordServiceClientCredentialFactory {
        constructor() {
            super('botAppId', 'botAppPassword');
        }
        createCredentials(): Promise<AppCredentials> {
            return Promise.resolve(new MockBFAppCredentials());
        }
    }

    it('should get auth token when auth is enabled', async () => {
        const postStub = sinonSandbox.stub(mockAxios, 'get').returns(Promise.resolve({ data: 'file.png' }));
        const attachment: Attachment = {
            contentUrl: 'http://localhost:3978/file.png',
            contentType: 'image/png',
            name: 'file.png'
        };
        const activity = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        } as Partial<Activity>;

        adapter = new TeamsAdapter({}, new MockCredentialsFactory(), undefined, {});

        downloader = new TeamsAttachmentDownloader({
            botAppId: 'botAppId',
            adapter: adapter
        });

        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await downloader.downloadFiles(context, state);

        assert.equal(postStub.calledOnce, true);

        assert.deepEqual(result, [
            {
                content: Buffer.from('file.png', 'binary'),
                contentType: 'image/png',
                contentUrl: 'http://localhost:3978/file.png'
            }
        ]);
        assert.equal(createStub.called, true);
    });

    it('should get auth token when auth is enabled for gov', async () => {
        const postStub = sinonSandbox.stub(mockAxios, 'get').returns(Promise.resolve({ data: 'file.png' }));
        const attachment: Attachment = {
            contentUrl: 'http://localhost:3978/file.png',
            contentType: 'image/png',
            name: 'file.png'
        };
        const activity = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        } as Partial<Activity>;

        adapter = new TeamsAdapter(
            {
                ToChannelFromBotLoginUrl: GovernmentConstants.ToChannelFromBotLoginUrl,
                ToChannelFromBotOAuthScope: GovernmentConstants.ToChannelFromBotOAuthScope,
                CallerId: CallerIdConstants.USGovChannel
            },
            new MockCredentialsFactory(),
            undefined,
            {}
        );

        downloader = new TeamsAttachmentDownloader({
            botAppId: 'botAppId',
            adapter: adapter
        });

        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await downloader.downloadFiles(context, state);

        assert.equal(postStub.calledOnce, true);

        assert.deepEqual(result, [
            {
                content: Buffer.from('file.png', 'binary'),
                contentType: 'image/png',
                contentUrl: 'http://localhost:3978/file.png'
            }
        ]);
        assert.equal(createStub.called, true);
    });

    it('should get auth token when auth is enabled for gov with no audience', async () => {
        const postStub = sinonSandbox.stub(mockAxios, 'get').returns(Promise.resolve({ data: 'file.png' }));
        const attachment: Attachment = {
            contentUrl: 'http://localhost:3978/file.png',
            contentType: 'image/png',
            name: 'file.png'
        };
        const activity = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        } as Partial<Activity>;

        adapter = new TeamsAdapter(
            {
                ToChannelFromBotLoginUrl: GovernmentConstants.ToChannelFromBotLoginUrl,
                CallerId: CallerIdConstants.USGovChannel
            },
            new MockCredentialsFactory(),
            undefined,
            {}
        );

        downloader = new TeamsAttachmentDownloader({
            botAppId: 'botAppId',
            adapter: adapter
        });

        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await downloader.downloadFiles(context, state);

        assert.equal(postStub.calledOnce, true);

        assert.deepEqual(result, [
            {
                content: Buffer.from('file.png', 'binary'),
                contentType: 'image/png',
                contentUrl: 'http://localhost:3978/file.png'
            }
        ]);
        assert.equal(createStub.called, true);
    });
});
