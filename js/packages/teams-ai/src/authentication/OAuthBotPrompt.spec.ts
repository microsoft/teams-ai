import { CardFactory, Channels, ConversationState, InputHints, MemoryStorage, TestAdapter } from 'botbuilder';
import { DialogSet, DialogTurnStatus } from 'botbuilder-dialogs';
import { OAuthBotPrompt } from './OAuthBotPrompt';
import * as UserTokenAccess from './UserTokenAccess';
import * as sinon from 'sinon';
import assert from 'assert';

describe('OAuthBotPrompt', () => {
    before(() => {
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
    const ssoConfigs = [true, false];

    ssoConfigs.forEach((enableSso) => {
        it(`should call OAuthBotPrompt (enabledSso: ${enableSso})`, async function () {
            const connectionName = 'myConnection';

            // Initialize TestAdapter.
            const adapter = new TestAdapter(async (turnContext) => {
                turnContext.activity.channelId = Channels.Msteams;
                const dc = await dialogs.createContext(turnContext);

                const results = await dc.continueDialog();
                if (results.status === DialogTurnStatus.empty) {
                    await dc.prompt('prompt', {});
                }
                await convoState.saveChanges(turnContext);
            });

            // Create new ConversationState with MemoryStorage
            const convoState = new ConversationState(new MemoryStorage());

            // Create a DialogState property, DialogSet and OAuthPrompt
            const dialogState = convoState.createProperty('dialogState');
            const dialogs = new DialogSet(dialogState);
            dialogs.add(
                new OAuthBotPrompt('prompt', {
                    connectionName,
                    title: 'Login',
                    timeout: 300000,
                    enableSso: true
                })
            );

            await adapter
                .send('Hello')
                .assertReply((activity) => {
                    assert(activity?.attachments?.length === 1);
                    assert(activity.inputHint === InputHints.AcceptingInput);
                    const card = activity?.attachments[0];
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
                })
                .startTest();
        });
    });
});
