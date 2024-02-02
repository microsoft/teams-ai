import assert from 'assert';
import { Activity, Attachment } from 'botbuilder';

import { createTestTurnContextAndState } from '../internals/testing/TestUtilities';
import { TestPromptManager } from '../internals/testing/TestPromptManager';
import { TeamsAdapter } from '../TeamsAdapter';
import { UserInputMessage } from './UserInputMessage';
import { GPT3Tokenizer } from '../tokenizers';

describe('UserInputMessage', () => {
    const adapter = new TeamsAdapter();
    const userInputMessage = new UserInputMessage(100);

    const functions = new TestPromptManager();
    const tokenizer = new GPT3Tokenizer();
    const base64String =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAJBJREFUaEPtksEJADAMhJL9l+4OglCC/Z8Q7c6Rt0fumA75rWRFKiIZ6GtJYjG2IlidNKyIJBZjK4LVScOKSGIxtiJYnTSsiCQWYyuC1UnDikhiMbYiWJ00rIgkFmMrgtVJw4pIYjG2IlidNKyIJBZjK4LVScOKSGIxtiJYnTSsiCQWYyuC1UnDikhiMfZMkQcQkQAzneSfdgAAAABJRU5ErkJggg==';

    it('constructor should create a UserInputMessage', async () => {
        assert.notEqual(userInputMessage, undefined);
        assert.equal(userInputMessage.tokens, 100);
        assert.equal(userInputMessage.required, true);
        assert.equal(userInputMessage.separator, '\n');
        assert.equal(userInputMessage.textPrefix, 'user: ');
    });

    it('renderAsMessages should return a message without attachment', async () => {
        const activity: Partial<Activity> = {
            type: 'message',
            text: 'Hello what do I do?'
        };
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const maxTokens = 100;

        const result = await userInputMessage.renderAsMessages(context, state, functions, tokenizer, maxTokens);
        assert.notEqual(result, undefined);
        assert.equal(result.output.length, 1);
        assert.equal(result.output[0].role, 'user');
        assert.equal(result.output[0].content[0].type, 'text');
        assert.equal(result.output[0].content[0].text, 'Hello what do I do?');
    });

    it('renderAsMessages should shorten message if budget is exceeded', async () => {
        const activity: Partial<Activity> = {
            type: 'message',
            text: 'Hello what do I do?'
        };
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const maxTokens = 1;

        const result = await userInputMessage.renderAsMessages(context, state, functions, tokenizer, maxTokens);
        assert.notEqual(result, undefined);
        assert.equal(result.output.length, 1);
        assert.equal(result.output[0].role, 'user');
        assert.equal(result.output[0].content[0].type, 'text');
        assert.equal(result.output[0].content[0].text, 'Hello');
    });

    it('renderAsMessages should return a message with attachment', async () => {
        const attachment: Attachment = {
            contentUrl: 'http://localhost:3978/transparent.png',
            contentType: 'image/png',
            name: 'transparent.png',
            // In base64, the following is simply a 50x50px transparent PNG
            content: base64String
        };
        const activity: Partial<Activity> = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        };
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await userInputMessage.renderAsMessages(context, state, functions, tokenizer, 100);
        assert.notEqual(result, undefined);
        assert.equal(result.output[0].role, 'user');
        assert.equal(result.output[0].content.length, 2);
        assert.equal(result.output[0].content[1].type, 'image_url');
        assert.equal(result.output[0].content[1].image_url.url, base64String);
    });

    it('renderAsMessages should return a message without attachment if budget is exceeded', async () => {
        const attachment: Attachment = {
            contentUrl: 'http://localhost:3978/transparent.png',
            contentType: 'image/png',
            name: 'transparent.png',
            // In base64, the following is simply a 50x50px transparent PNG
            content: base64String
        };
        const activity: Partial<Activity> = {
            type: 'message',
            text: 'Here is the attachment',
            attachments: [attachment]
        };
        const [context, state] = await createTestTurnContextAndState(adapter, activity);

        const result = await userInputMessage.renderAsMessages(context, state, functions, tokenizer, 20);
        assert.notEqual(result, undefined);
        assert.equal(result.output[0].role, 'user');
        assert.equal(result.output[0].content.length, 1);
    });
});
