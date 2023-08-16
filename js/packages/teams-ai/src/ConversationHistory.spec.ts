import { strict as assert } from 'assert';
import { ConversationHistory } from './ConversationHistory';
import { TurnStateEntry, TurnState } from './TurnState';

/* eslint-disable security/detect-object-injection */
describe('ConversationHistory', () => {
    describe('addLine()', () => {
        it('should create history if it does not exist', () => {
            const state: TurnState = { conversation: new TurnStateEntry() };

            ConversationHistory.addLine(state, 'test');

            assert(Array.isArray(state.conversation.value[ConversationHistory.StatePropertyName]));
            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName].length, 1);
        });

        it('should prune history if too long', () => {
            const mockHistory = ['This', 'History', 'Is', 'Too', 'Long', 'To', 'Fit', 'In', 'The', 'History', 'Array'];

            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: mockHistory })
            };

            const mockStateAddition = 'Overflow!';
            ConversationHistory.addLine(state, mockStateAddition);
            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName].length, 10);
            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName][9], mockStateAddition);
        });

        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.addLine(state, 'test'));
        });
    });

    describe('appendToLastLine()', () => {
        it('should append the text to the last line', () => {
            const mockHistory = ['History'];
            const lineToBeAppended = ' is important!';
            const expectedLine = mockHistory[0] + lineToBeAppended;
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: mockHistory })
            };

            ConversationHistory.appendToLastLine(state, lineToBeAppended);
            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName].length, 1);
            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName][0], expectedLine);
        });
    });

    describe('clear()', () => {
        it('should clear the conversation state', () => {
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: ['test'] })
            };

            ConversationHistory.clear(state);
        });

        // TODO: (Discussion) Should it actually throw an error if there is no "conversation" member?
        // It seems unnecessarily strict for an operation that clears the state...
        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.clear(state));
        });
    });

    describe('hasMoreLines()', () => {
        it('should return true when there is history, otherwise false', () => {
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: ['1'] })
            };

            assert(ConversationHistory.hasMoreLines(state));

            const emptyState: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: [] })
            };
            assert(!ConversationHistory.hasMoreLines(emptyState));
        });

        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.hasMoreLines(state));
        });
    });

    describe('getLastLine()', () => {
        it('should return the last line in the history', () => {
            const expectedLastLine = 'test';
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: [expectedLastLine] })
            };

            const lastLine = ConversationHistory.getLastLine(state);

            assert.equal(lastLine, expectedLastLine);
        });

        it('should return empty string if history is not an array', () => {
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: null })
            };

            const lastLine = ConversationHistory.getLastLine(state);
            assert.equal(lastLine, '');
        });

        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.getLastLine(state));
        });
    });

    describe('getLastSay()', () => {
        it('should return the last SAY response', async () => {
            const expectedResponse = 'Response';
            const state: TurnState = {
                conversation: new TurnStateEntry({
                    [ConversationHistory.StatePropertyName]: [`Assistant: SAY ${expectedResponse}`]
                })
            };

            const lastSay = ConversationHistory.getLastSay(state);
            assert.equal(lastSay, expectedResponse);
        });

        it('should return whole last line if no SAY is found', async () => {
            const expectedResponse = 'Response';
            const state: TurnState = {
                conversation: new TurnStateEntry({
                    [ConversationHistory.StatePropertyName]: [expectedResponse]
                })
            };

            const lastSay = ConversationHistory.getLastSay(state);
            assert.equal(lastSay, expectedResponse);
        });
    });

    describe('removeLastLine()', () => {
        it('should return last line and update history', () => {
            const expectedLastLine = 'Line To Be Removed';
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: ['1', expectedLastLine] })
            };

            const removedLastLine = ConversationHistory.removeLastLine(state);
            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName].length, 1);
            assert.equal(removedLastLine, expectedLastLine);
        });

        it('should create history if it does not exist and return undefined', () => {
            const state: TurnState = { conversation: new TurnStateEntry() };

            const undefinedString = ConversationHistory.removeLastLine(state);
            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName].length, 0);
            assert(undefinedString === undefined);
        });

        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.removeLastLine(state));
        });
    });

    describe('replaceLastLine()', () => {
        it('should replace the last line of history', () => {
            const expectedLastLine = 'expected';
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: ['ToBeReplaced'] })
            };

            ConversationHistory.replaceLastLine(state, expectedLastLine);
            const lastLine = ConversationHistory.getLastLine(state);

            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName].length, 1);
            assert.equal(lastLine, expectedLastLine);
        });

        it('should set the last line if no history exists', () => {
            const expectedLastLine = 'test';
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: null })
            };

            ConversationHistory.replaceLastLine(state, expectedLastLine);
            const lastLine = ConversationHistory.getLastLine(state);

            assert.equal(state.conversation.value[ConversationHistory.StatePropertyName].length, 1);
            assert.equal(lastLine, expectedLastLine);
        });

        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.replaceLastLine(state, 'line'));
        });
    });

    describe('replaceLastSay()', () => {
        it('should replace the last SAY with a new response', () => {
            const expectedSay = 'New Expected Response';
            const state: TurnState = {
                conversation: new TurnStateEntry({
                    [ConversationHistory.StatePropertyName]: ['Assistant: SAY ToBeReplaced']
                })
            };

            ConversationHistory.replaceLastSay(state, expectedSay);
            const lastSay = ConversationHistory.getLastSay(state);
            assert.equal(lastSay, expectedSay);
        });

        it('should set a new SAY if no history exists', () => {
            const expectedSay = 'New Expected Response';
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: null })
            };

            ConversationHistory.replaceLastSay(state, expectedSay);
            const lastSay = ConversationHistory.getLastSay(state);
            assert.equal(lastSay, expectedSay);
        });

        it('should append SAY after any DO', () => {
            const originalLastLine = 'Assistant: DO WishForAResponse';
            const expectedSay = 'New Expected Response';
            const expectedLastLine = `${originalLastLine} THEN SAY ${expectedSay}`;
            const state: TurnState = {
                conversation: new TurnStateEntry({
                    [ConversationHistory.StatePropertyName]: [originalLastLine]
                })
            };

            ConversationHistory.replaceLastSay(state, expectedSay);
            const lastSay = ConversationHistory.getLastSay(state);
            assert.equal(lastSay, expectedSay);
            const lastLine = ConversationHistory.getLastLine(state);
            assert.equal(lastLine, expectedLastLine);
        });

        // TODO: (Discussion) When history exists, but no SAY or DO exist in the last line, replacing the entire line with `${assistantPrefix}${newResponse}` doesn't ensure that SAY is included in newResponse.
        // This behavior doesn't follow the same behavior as when a SAY or DO is already found in the last line.
        // We need to decide if the newResponse should always have `SAY ` prefixed or not.
        it.skip('should replace entire last line if no SAY or DO found', () => {
            const replacingResponse = 'New Expected Response';
            const expectedLastLine = `Assistant: SAY ${replacingResponse}`;
            const state: TurnState = {
                conversation: new TurnStateEntry({
                    [ConversationHistory.StatePropertyName]: ['LineToBeReplaced']
                })
            };

            ConversationHistory.replaceLastSay(state, replacingResponse);
            const lastSay = ConversationHistory.getLastSay(state);
            assert.equal(lastSay, replacingResponse);
            const lastLine = ConversationHistory.getLastLine(state);
            assert.equal(lastLine, expectedLastLine);
        });

        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.replaceLastSay(state, 'newResponse'));
        });
    });

    describe('toString()', () => {
        it('should return the most recent lines of history as a string', () => {
            const mockHistory = ['History', ' is important!'];
            const expectedLine = mockHistory[0] + '\n' + mockHistory[1];
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: mockHistory })
            };

            const stringHistory = ConversationHistory.toString(state);
            assert.equal(stringHistory, expectedLine);
        });

        it('should respect the maxTokens and lineSeparator parameters', () => {
            const mockHistory = ['Older Skipped Tokens', 'Skipped Tokens', 'History Rules!'];
            const lineSeparator = '*';
            const expectedLine = mockHistory[2] + lineSeparator;
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: mockHistory })
            };

            const stringHistory = ConversationHistory.toString(state, 4, lineSeparator);
            assert.equal(stringHistory, expectedLine);
        });

        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.toString(state));
        });
    });

    describe('toArray()', () => {
        it('should return the most recent lines of history as an array', () => {
            const mockHistory = ['History', ' is important!'];
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: mockHistory })
            };

            const stateHistory = ConversationHistory.toArray(state);
            assert.equal(stateHistory.length, 2);
            assert.equal(stateHistory[0], mockHistory[0]);
            assert.equal(stateHistory[1], mockHistory[1]);
        });

        it('should respect the maxTokens parameter', () => {
            const mockHistory = ['Skipped tokens', 'History'];
            const state: TurnState = {
                conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: mockHistory })
            };

            const stateHistory = ConversationHistory.toArray(state, 1);
            assert.equal(stateHistory.length, 1);
            assert.equal(stateHistory[0], mockHistory[1]);
        });

        it('should throw an Error if state has no "conversation" member', () => {
            const state: TurnState = {};

            assert.throws(() => ConversationHistory.toArray(state));
        });
    });
});
