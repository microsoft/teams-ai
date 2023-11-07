// import * as sinon from 'sinon';
// import { BotAuthentication } from './BotAuthentication';
// import { MessagingExtensionAuthentication } from './MessagingExtensionAuthentication';
// import { Application } from '../Application';
// import { OAuthPromptSettings } from 'botbuilder-dialogs';
// import { Authentication } from './Authentication';
// import { TurnStateEntry } from '../TurnState';
// import { Activity, ActivityTypes, TestAdapter, TurnContext } from 'botbuilder';
// import { DefaultTurnState } from '../DefaultTurnStateManager';
// import { ConversationHistory } from '../ConversationHistory';
// import assert from 'assert';
// import * as UserTokenAccess from './UserTokenAccess';

// describe('Authentication', () => {
//     const adapter = new TestAdapter();

//     let botAuth: BotAuthentication;
//     let botAuthMock: sinon.SinonMock;
//     let messageExtensionsAuth: MessagingExtensionAuthentication;
//     let messagingExtensionAuthMock: sinon.SinonMock;
//     let app: Application;
//     let appStub: sinon.SinonStubbedInstance<Application>;
//     let settings: OAuthPromptSettings;
//     let auth: Authentication;

//     const createTurnContextAndState = (activity: Partial<Activity>): [TurnContext, DefaultTurnState] => {
//         const context = new TurnContext(adapter, activity);
//         const state: DefaultTurnState = {
//             conversation: new TurnStateEntry({ [ConversationHistory.StatePropertyName]: [] }),
//             user: new TurnStateEntry(),
//             dialog: new TurnStateEntry(),
//             temp: new TurnStateEntry()
//         };
//         return [context, state];
//     };

//     beforeEach(() => {
//         app = new Application({ adapter });
//         appStub = sinon.stub(app);
//         settings = {
//             title: 'test',
//             connectionName: 'test'
//         };

//         messageExtensionsAuth = new MessagingExtensionAuthentication(settings);
//         messagingExtensionAuthMock = sinon.mock(messageExtensionsAuth);

//         botAuth = new BotAuthentication(appStub, settings);
//         botAuthMock = sinon.mock(botAuth);

//         auth = new Authentication(appStub, settings, undefined, messageExtensionsAuth, botAuth);
//     });

//     describe('signInUser()', () => {
//         it('should call botAuth.authenticate() when activity type is message', async () => {
//             botAuthMock.expects('authenticate').once();
//             messagingExtensionAuthMock.expects('authenticate').never();

//             const [context, state] = createTurnContextAndState({ type: ActivityTypes.Message });

//             await auth.signInUser(context, state);

//             botAuthMock.verify();
//             messagingExtensionAuthMock.verify();
//         });

//         it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/query activity', async () => {
//             messagingExtensionAuthMock.expects('authenticate').once();
//             botAuthMock.expects('authenticate').never();

//             const [context, state] = createTurnContextAndState({
//                 type: ActivityTypes.Invoke,
//                 name: 'composeExtension/query'
//             });

//             await auth.signInUser(context, state);

//             messagingExtensionAuthMock.verify();
//             botAuthMock.verify();
//         });

//         it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/queryLink activity', async () => {
//             messagingExtensionAuthMock.expects('authenticate').once();
//             botAuthMock.expects('authenticate').never();

//             const [context, state] = createTurnContextAndState({
//                 type: ActivityTypes.Invoke,
//                 name: 'composeExtension/queryLink'
//             });

//             await auth.signInUser(context, state);

//             messagingExtensionAuthMock.verify();
//             botAuthMock.verify();
//         });

//         it('should call messageExtensionsAuth.authenticate() when activity type is a composeExtension/fetchTask activity', async () => {
//             messagingExtensionAuthMock.expects('authenticate').once();
//             botAuthMock.expects('authenticate').never();

//             const [context, state] = createTurnContextAndState({
//                 type: ActivityTypes.Invoke,
//                 name: 'composeExtension/fetchTask'
//             });

//             await auth.signInUser(context, state);

//             messagingExtensionAuthMock.verify();
//             botAuthMock.verify();
//         });

//         it('should throw error is activity type is not valid for botAuth or messagingExtensionAuth', async () => {
//             const [context, state] = createTurnContextAndState({
//                 type: ActivityTypes.Event
//             });

//             // auth.signInUser throws and error.
//             assert.rejects(
//                 () => auth.signInUser(context, state),
//                 new Error('signInUser() is not supported for this activity type.')
//             );
//         });
//     });

//     describe('signOutUser()', () => {
//         let userTokenAccessStub: sinon.SinonStub;
//         let context: TurnContext;
//         let state: DefaultTurnState;

//         before(() => {
//             userTokenAccessStub = sinon.stub(UserTokenAccess, 'signOutUser');
//         });

//         beforeEach(() => {
//             [context, state] = createTurnContextAndState({
//                 type: ActivityTypes.Message,
//                 from: {
//                     id: 'test',
//                     name: 'test'
//                 },
//                 channelId: 'test'
//             });
//         });

//         it('should call botAuth.deleteAuthFlowState()', async () => {
//             botAuthMock.expects('deleteAuthFlowState').once();

//             await auth.signOutUser(context, state);

//             botAuthMock.verify();
//         });

//         it('should call UserTokenAccess.signOutUser()', async () => {
//             await auth.signOutUser(context, state);

//             userTokenAccessStub.calledOnce;
//         });
//     });

//     describe('canSignInUser()', () => {
//         const truthyCases = [
//             [ActivityTypes.Message],
//             [ActivityTypes.Invoke, 'composeExtension/query'],
//             [ActivityTypes.Invoke, 'composeExtension/queryLink'],
//             [ActivityTypes.Invoke, 'composeExtension/fetchTask']
//         ];

//         truthyCases.forEach(([activityType, activityName]) => {
//             it(`should return true when activity type is '${activityType}' 
//             and activity name: ${activityName || 'N/A'}`, async () => {
//                 const [context, _state] = createTurnContextAndState({
//                     type: ActivityTypes.Message
//                 });

//                 const result = auth.canSignInUser(context);

//                 assert(result);
//             });
//         });

//         it(`should return false if activity type is not valid`, async () => {
//             const [context, _state] = createTurnContextAndState({
//                 type: ActivityTypes.Event
//             });

//             const result = auth.canSignInUser(context);

//             assert.equal(result, false);
//         });
//     });

//     describe('onUserSignIn()', () => {
//         it(`should call botAuth.onUserSignIn()`, async () => {
//             botAuthMock.expects('onUserSignIn').once();

//             auth.onUserSignIn(() => Promise.resolve());

//             botAuthMock.verify();
//         });
//     });
// });
