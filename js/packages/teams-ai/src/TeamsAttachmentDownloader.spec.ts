import { strict as assert } from 'assert';

import { Application } from './Application';
import { TeamsAdapter } from './TeamsAdapter';
import { TeamsAttachmentDownloader } from './TeamsAttachmentDownloader';
import { Activity, Attachment } from 'botbuilder';

import { createTestTurnContextAndState } from './internals/testing/TestUtilities';
import sinon, { createSandbox } from 'sinon';

import axios from 'axios';

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
        // const state = new TurnState();
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
        // const state = new TurnState();
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
        // const state = new TurnState();
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
        // const state = new TurnState();
        const result = await downloader.downloadFiles(context, state);

        assert.deepEqual(result, []);
    });
});
