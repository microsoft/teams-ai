/* eslint-disable security/detect-object-injection */
import assert from 'assert';
import { TurnState } from '../TurnState';
import {
    deleteTokenFromState,
    deleteUserInSignInFlow,
    setTokenInState,
    setUserInSignInFlow,
    userInSignInFlow
} from './BotAuthenticationBase';
import { Activity, TestAdapter, TurnContext } from 'botbuilder';

describe('BotAuthenticationBase.ts utility functions', () => {
    const createTurnContextAndState = async (activity: Partial<Activity>): Promise<[TurnContext, TurnState]> => {
        const adapter = new TestAdapter();
        const context = new TurnContext(adapter, {
            channelId: 'msteams',
            recipient: {
                id: 'bot',
                name: 'bot'
            },
            from: {
                id: 'user',
                name: 'user'
            },

            conversation: {
                id: 'convo',
                isGroup: false,
                conversationType: 'personal',
                name: 'convo'
            },
            ...activity
        });
        const state: TurnState = new TurnState();
        await state.load(context);
        state.temp = {
            input: '',
            history: '',
            lastOutput: '',
            actionOutputs: {},
            authTokens: {}
        };

        return [context, state];
    };

    describe('setTokenInState()', () => {
        it('should set token in state', async () => {
            const [_, state] = await createTurnContextAndState({});
            const settingName = 'settingName';
            const token = 'token';

            setTokenInState<TurnState>(state, settingName, token);

            assert(state.temp.authTokens[settingName] == token);
        });
    });

    describe('deleteTokenFromState()', () => {
        it('should delete token from state', async () => {
            const [_, state] = await createTurnContextAndState({});
            const settingName = 'settingName';
            const token = 'token';

            state.temp.authTokens[settingName] = token;
            deleteTokenFromState<TurnState>(state, settingName);

            assert(!state.temp.authTokens[settingName]);
        });
    });

    describe('userInSignInFlow()', async () => {
        it('should return undefined when user is not in sign in flow', async () => {
            const [_, state] = await createTurnContextAndState({});

            const response = userInSignInFlow<TurnState>(state);

            assert(!response);
        });

        it('should return setting name when user is in sign in flow', async () => {
            const [_, state] = await createTurnContextAndState({});
            const settingName = 'settingName';

            (state.user as any)['__InSignInFlow__'] = settingName;
            const response = userInSignInFlow<TurnState>(state);

            assert(response == settingName);
        });
    });

    describe('setUserInSignInFlow()', async () => {
        it('should set user in sign in flow', async () => {
            const [_, state] = await createTurnContextAndState({});
            const settingName = 'settingName';

            setUserInSignInFlow<TurnState>(state, settingName);

            assert((state.user as any)['__InSignInFlow__'] == settingName);
        });
    });

    describe('deleteUserInSignInFlow()', () => {
        it('should delete user in sign in flow', async () => {
            const [_, state] = await createTurnContextAndState({});
            const settingName = 'settingName';

            (state.user as any)['__InSignInFlow__'] = settingName;
            deleteUserInSignInFlow<TurnState>(state);

            assert((state.user as any)['__InSignInFlow__'] == undefined);
        });
    });
});
