import { TurnState } from "./TurnState";
import { MemoryStorage, TurnContext } from "botbuilder";

export class TestTurnState extends TurnState {
    private constructor() {
        super();
    }

    public static async create(context: TurnContext, testState?: {user?: Record<string, any>; conversation?: Record<string, any>; temp?: Record<string, any>;}): Promise<TestTurnState> {
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