import { TurnState } from '../../TurnState';
import { MemoryStorage, TurnContext } from 'botbuilder';

/**
 * A test version of the TurnState class used by unit tests.
 */
export class TestTurnState extends TurnState {
    /**
     * @private
     */
    private constructor() {
        super();
    }

    /**
     * Creates a new `TestTurnState` instance.
     * @param {TurnContext} context Context for the current turn of conversation with the user.
     * @param {TestTurnState} testState Optional. State to initialize the new instance with.
     * @param {any} testState.user User state to initialize the new instance with.
     * @param {any} testState.conversation Conversation state to initialize the new instance with.
     * @param {any} testState.temp Temporary state to initialize the new instance with.
     * @returns {Promise<TestTurnState>} Created `TestTurnState` instance.
     */
    public static async create(
        context: TurnContext,
        testState?: { user?: Record<string, any>; conversation?: Record<string, any>; temp?: Record<string, any> }
    ): Promise<TestTurnState> {
        const storage = new MemoryStorage();
        const state = new TestTurnState();
        await state.load(context, storage);
        if (testState) {
            if (testState.user) {
                state.user = testState.user;
            }
            if (testState.conversation) {
                state.conversation = testState.conversation;
            }
            if (testState.temp) {
                state.temp = testState.temp as any;
            }
        }
        return state;
    }
}
