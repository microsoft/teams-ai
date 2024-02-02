import { Dialog, DialogSet, DialogState } from 'botbuilder-dialogs';
import { OAuthBotPrompt } from './OAuthBotPrompt';
import * as UserTokenAccess from './UserTokenAccess';
import * as sinon from 'sinon';
import assert from 'assert';
import { TurnStateProperty } from '../TurnStateProperty';
import { Activity, CardFactory, InputHints, TestAdapter, TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';

describe('OAuthBotPrompt', function () {
    const adapter = new TestAdapter();

    const createTurnContextAndState = async (activity: Partial<Activity>): Promise<[TurnContext, TurnState]> => {
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
            inputFiles: [],
            lastOutput: '',
            actionOutputs: {},
            authTokens: {}
        };

        return [context, state];
    };

    before(() => {
        sinon.restore();
        sinon.stub(UserTokenAccess, 'getSignInResource').callsFake(async () => {
            return {
                signInLink: 'testlink',
                tokenExchangeResource: {
                    id: 'testid',
                    uri: 'testuri'
                },
                tokenPostResource: {
                    sasUrl: 'testsasurl'
                }
            };
        });

        sinon.stub(UserTokenAccess, 'getUserToken');
    });

    describe('beginDialog', () => {
        let promptMock: sinon.SinonMock;

        before(() => {
            promptMock = sinon.mock(OAuthBotPrompt);
        });

        it('should call sendOAuthCard and return Dialog.EndOfTurn', async function () {
            const [context, state] = await createTurnContextAndState({
                type: 'message',
                from: {
                    id: 'test',
                    name: 'test'
                }
            });

            const settings = {
                connectionName: 'myConnection',
                title: 'Login',
                timeout: 300000,
                enableSso: true
            };
            const prompt = new OAuthBotPrompt('OAuthPrompt', settings);

            const dialogStateProperty = 'dialogStateProperty';
            const accessor = new TurnStateProperty<DialogState>(state, 'conversation', dialogStateProperty);
            const dialogSet = new DialogSet(accessor);
            dialogSet.add(prompt);
            const dialogContext = await dialogSet.createContext(context);
            console.log(dialogContext);
            promptMock.expects('sendOAuthCard').once();

            const result = await dialogContext.beginDialog('OAuthPrompt');

            assert(result === Dialog.EndOfTurn);
            promptMock.verify();
        });

        after(() => {
            promptMock.restore();
        });
    });

    describe('sendOAuthCard', () => {
        const ssoConfigs = [true, false];

        ssoConfigs.forEach((enableSso) => {
            it(`should return oauth card (enabledSso: ${enableSso})`, async function () {
                const [context, _] = await createTurnContextAndState({
                    type: 'message',
                    from: {
                        id: 'test',
                        name: 'test'
                    }
                });
                const connectionName = 'myConnection';
                const settings = {
                    connectionName: connectionName,
                    title: 'Login',
                    timeout: 300000,
                    enableSso: enableSso
                };

                let returnedActivity: Partial<Activity> = {};
                sinon.stub(context, 'sendActivity').callsFake(async (activity) => {
                    returnedActivity = activity as Partial<Activity>;
                    return undefined;
                });

                await OAuthBotPrompt.sendOAuthCard(settings, context, 'prompt');

                assert(returnedActivity);
                assert(returnedActivity?.attachments?.length === 1);
                assert(returnedActivity.inputHint === InputHints.AcceptingInput);
                const card = returnedActivity?.attachments[0];
                assert(card.contentType === CardFactory.contentTypes.oauthCard);
                assert(card.content?.buttons.length === 1);
                assert(card.content?.buttons[0].type === 'signin');
                assert(card.content?.buttons[0].title === 'Login');
                assert(card.content?.buttons[0].value === 'testlink');
                assert(card.content?.connectionName === connectionName);
                assert(card.content?.tokenPostResource?.sasUrl === 'testsasurl');
                if (enableSso) {
                    assert(card.content?.tokenExchangeResource?.id === 'testid');
                    assert(card.content?.tokenExchangeResource?.uri === 'testuri');
                }
            });
        });
    });
});
