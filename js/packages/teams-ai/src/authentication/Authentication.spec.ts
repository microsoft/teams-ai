import * as sinon from 'sinon';
import { BotAuthentication } from './BotAuthentication';
import { MessagingExtensionAuthentication } from './MessagingExtensionAuthentication';
import { Application } from '../Application';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { AuthError, Authentication } from './Authentication';
import { TurnStateEntry } from '../TurnState';
import { Activity, ActivityTypes, TestAdapter, TurnContext } from 'botbuilder';
import { DefaultTurnState } from '../DefaultTurnStateManager';
import { ConversationHistory } from '../ConversationHistory';
import assert from 'assert';
import * as UserTokenAccess from './UserTokenAccess';

describe('Authentication', () => {
    const adapter = new TestAdapter();

    let botAuth: BotAuthentication;
    let botAuthenticateStub: sinon.SinonStub;
    let messageExtensionsAuth: MessagingExtensionAuthentication;
    let messagingExtensionAuthenticateStub: sinon.SinonStub;
    let app: Application;
    let appStub: sinon.SinonStubbedInstance<Application>;
    let settings: OAuthPromptSettings;
    let auth: Authentication;
    const settingName = 'settingName';

    const createTurnContextAndState = (activity: Partial<Activity>): [TurnContext, DefaultTurnState] => {
        const context = new TurnContext(adapter, activity);
        const state: DefaultTurnState = {
            conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: [] }),
            user: new TurnStateEntry(),
            dialog: new TurnStateEntry(),
            temp: new TurnStateEntry()
        };
        return [context, state];
    };

    beforeEach(() => {
        app = new Application({ adapter });
        appStub = sinon.stub(app);
        settings = {
            title: 'test',
            connectionName: 'test'
        };

        messageExtensionsAuth = new MessagingExtensionAuthentication();
        messagingExtensionAuthenticateStub = sinon.stub(messageExtensionsAuth, 'authenticate');
        botAuth = new BotAuthentication(appStub, settings, settingName);
        botAuthenticateStub = sinon.stub(botAuth, 'authenticate');

        auth = new Authentication(appStub, settingName, settings, undefined, messageExtensionsAuth, botAuth);
    });

    describe('signInUser()', () => {
        before(() => {
            sinon.stub(UserTokenAccess, 'getUserToken');
        });

        after(() => {
            sinon.restore();
        });

        it('should call botAuth.authenticate() when activity type is message and the text is a non-empty string', async () => {
            const isUserSignedInStub = sinon.stub(auth, 'isUserSignedIn').returns(Promise.resolve(undefined));

            const [context, state] = createTurnContextAndState({ type: ActivityTypes.Message, text: 'non empty' });

            await auth.signInUser(context, state);

            assert(isUserSignedInStub.calledOnce);
            assert(botAuthenticateStub.calledOnce);
        });

        it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/query activity', async () => {
            const [context, state] = createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/query'
            });

            await auth.signInUser(context, state);

            messagingExtensionAuthenticateStub.calledOnce;
            botAuthenticateStub.notCalled;
        });

        it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/queryLink activity', async () => {
            const [context, state] = createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/queryLink'
            });

            await auth.signInUser(context, state);

            messagingExtensionAuthenticateStub.calledOnce;
            botAuthenticateStub.notCalled;
        });

        it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/fetchTask activity', async () => {
            const [context, state] = createTurnContextAndState({
                type: ActivityTypes.Invoke,
                name: 'composeExtension/fetchTask'
            });

            await auth.signInUser(context, state);

            messagingExtensionAuthenticateStub.calledOnce;
            botAuthenticateStub.notCalled;
        });

        it('should throw error is activity type is not valid for botAuth or messagingExtensionAuth', async () => {
            const [context, state] = createTurnContextAndState({
                type: ActivityTypes.Event
            });

            assert.rejects(
                async () => await auth.signInUser(context, state),
                new AuthError(
                    'Incomming activity is not a valid activity to initiate authentication flow.',
                    'invalidActivity'
                )
            );
        });
    });

    describe('signOutUser()', () => {
        let userTokenAccessStub: sinon.SinonStub;
        let context: TurnContext;
        let state: DefaultTurnState;

        before(() => {
            userTokenAccessStub = sinon.stub(UserTokenAccess, 'signOutUser');
        });

        beforeEach(() => {
            [context, state] = createTurnContextAndState({
                type: ActivityTypes.Message,
                from: {
                    id: 'test',
                    name: 'test'
                },
                channelId: 'test'
            });
        });

        it('should call botAuth.deleteAuthFlowState()', async () => {
            const botAuthDeleteAuthFlowStateStub = sinon.stub(botAuth, 'deleteAuthFlowState');

            await auth.signOutUser(context, state);

            botAuthDeleteAuthFlowStateStub.calledOnce;
        });

        it('should call UserTokenAccess.signOutUser()', async () => {
            await auth.signOutUser(context, state);

            userTokenAccessStub.calledOnce;
        });
    });

    describe('onUserSignInSuccess()', () => {
        it(`should call botAuth.onUserSignInSuccess()`, async () => {
            const botAuthDeleteAuthFlowStateStub = sinon.stub(botAuth, 'onUserSignInSuccess');

            auth.onUserSignInSuccess(() => Promise.resolve());

            botAuthDeleteAuthFlowStateStub.calledOnce;
        });
    });

    describe('onUserSignInFailure()', () => {
        it(`should call botAuth.onUserSignInFailure()`, async () => {
            const botAuthDeleteAuthFlowStateStub = sinon.stub(botAuth, 'onUserSignInFailure');

            auth.onUserSignInSuccess(() => Promise.resolve());

            botAuthDeleteAuthFlowStateStub.calledOnce;
        });
    });

    describe('isUserSignedIn()', () => {
        let context: TurnContext;
        let getUserTokenStub: sinon.SinonStub;

        beforeEach(() => {
            const obj = createTurnContextAndState({
                type: ActivityTypes.Message,
                from: {
                    id: 'test',
                    name: 'test'
                },
                channelId: 'test'
            });

            context = obj[0];
        });

        afterEach(() => {
            sinon.restore();
        });

        it(`should call UserTokenAccess.getUserToken`, async () => {
            getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken');

            await auth.isUserSignedIn(context);

            getUserTokenStub.calledOnce;
        });

        it(`should return token if UserTokenAccess.getUserToken returns token`, async () => {
            getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken').returns(
                Promise.resolve({
                    token: 'token',
                    connectionName: 'connectionName',
                    expiration: 'expiration'
                })
            );

            const response = await auth.isUserSignedIn(context);

            assert(response == 'token');
            getUserTokenStub.calledOnce;
        });

        it(`should return undefined if UserTokenAccess.getUserToken returns empty string for token`, async () => {
            getUserTokenStub = sinon.stub(UserTokenAccess, 'getUserToken').returns(
                Promise.resolve({
                    token: '',
                    connectionName: 'connectionName',
                    expiration: 'expiration'
                })
            );

            const response = await auth.isUserSignedIn(context);

            assert(response == undefined);
            getUserTokenStub.calledOnce;
        });
    });
});
