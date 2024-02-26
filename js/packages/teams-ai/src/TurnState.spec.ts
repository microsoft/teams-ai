import { strict as assert } from 'assert';
import { TurnState } from './TurnState';
import { createTestTurnContextAndState } from './internals/testing/TestUtilities';
import { TeamsAdapter } from './TeamsAdapter';
import { Activity } from 'botbuilder';

describe('TurnState', () => {
    let adapter: TeamsAdapter;
    let activity: Partial<Activity>;
    let turnState: TurnState;

    beforeEach(() => {
        turnState = new TurnState();
        activity = {
            type: 'message',
            text: 'Here is the attachment'
        };
    });

    describe('conversation', () => {
        it("should throw an error if TurnState hasn't been loaded", () => {
            assert.throws(() => turnState.conversation, new Error("TurnState hasn't been loaded. Call load() first."));
        });

        it('should get and set the conversation state', async () => {
            const [context, _] = await createTestTurnContextAndState(adapter, activity);
            const conversationState = { prop: 'value' };

            await turnState.load(context);

            // Set the conversation state
            turnState.conversation = conversationState;
            // Get the conversation state
            const retrievedConversationState = turnState.conversation;

            // Assert that the retrieved conversation state is the same as the original conversation state
            assert.equal(retrievedConversationState, conversationState);
        });
    });

    describe('temp', () => {
        it("should throw an error if TurnState hasn't been loaded", () => {
            assert.throws(() => turnState.temp, new Error("TurnState hasn't been loaded. Call load() first."));
        });

        it('should get and set the temp state', async () => {
            const [context, turnState] = await createTestTurnContextAndState(adapter, activity);
            turnState.load(context);
            const tempState = {
                actionOutputs: {},
                authTokens: {},
                input: context.activity.text,
                inputFiles: undefined,
                lastOutput: ''
            };
            // Get the temp state
            const retrievedTempState = turnState.temp;

            // Assert that the retrieved temp state is the same as the original temp state
            assert.deepEqual(retrievedTempState, tempState);
        });
    });

    describe('user', () => {
        it("should throw an error if TurnState hasn't been loaded", () => {
            assert.throws(() => turnState.user, new Error("TurnState hasn't been loaded. Call load() first."));
        });

        it('should get and set the user state', async () => {
            const [context, turnState] = await createTestTurnContextAndState(adapter, activity);
            // Mock the user state
            turnState.load(context);
            const userState = { prop: 'value' };
            // Set the user state
            turnState.user = userState;

            // Get the user state
            const retrievedUserState = turnState.user;

            // Assert that the retrieved user state is the same as the original user state
            assert.equal(retrievedUserState, userState);
        });
    });

    describe('deleteConversationState', () => {
        it("should throw an error if TurnState hasn't been loaded", () => {
            assert.throws(
                () => turnState.deleteConversationState(),
                new Error("TurnState hasn't been loaded. Call load() first.")
            );
        });

        it('should delete the conversation state', async () => {
            const [context, turnState] = await createTestTurnContextAndState(adapter, activity);
            // Mock the user state
            turnState.load(context);
            // Mock the conversation state
            const conversationState = { prop: 'value' };

            // Set the conversation state
            turnState.conversation = conversationState;

            // Delete the conversation state
            turnState.deleteConversationState();

            // Get the conversation state
            const retrievedConversationState = turnState.conversation;

            // Assert that the conversation state is undefined
            assert.deepEqual(retrievedConversationState, {});
        });
    });

    describe('deleteTempState', () => {
        it("should throw an error if TurnState hasn't been loaded", () => {
            assert.throws(
                () => turnState.deleteTempState(),
                new Error("TurnState hasn't been loaded. Call load() first.")
            );
        });

        it('should delete the temp state', async () => {
            const [context, turnState] = await createTestTurnContextAndState(adapter, activity);

            turnState.load(context);

            // Delete the temp state
            turnState.deleteTempState();

            // Get the temp state
            const retrievedTempState = turnState.temp;

            // Assert that the temp state is undefined
            assert.deepEqual(retrievedTempState, {});
        });
    });

    describe('deleteUserState', () => {
        it('should delete the user state', async () => {
            const [context, turnState] = await createTestTurnContextAndState(adapter, activity);

            turnState.load(context);
            // Mock the user state
            const userState = { prop: 'value' };

            // Set the user state
            turnState.user = userState;

            // Delete the user state
            turnState.deleteUserState();

            // Get the user state
            const retrievedUserState = turnState.user;

            // Assert that the user state is undefined
            assert.deepEqual(retrievedUserState, {});
        });
    });
});
