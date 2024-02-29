// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    ActionTypes,
    Activity,
    ActivityTypes,
    CardFactory,
    Channels,
    ConversationState,
    InputHints,
    MemoryStorage,
    StatePropertyAccessor,
    StatusCodes,
    TestAdapter,
    tokenExchangeOperationName,
    verifyStateOperationName,
    TokenResponse
} from 'botbuilder-core';
import { DialogSet, DialogState, DialogTurnStatus } from 'botbuilder-dialogs';
import { TeamsSsoPrompt } from './TeamsBotSsoPrompt';
import * as sinon from 'sinon';
import * as assert from 'assert';
import { promisify } from 'util';
import { AuthenticationResult, ConfidentialClientApplication } from '@azure/msal-node';
import { TeamsSsoSettings } from './TeamsSsoSettings';

describe('TeamsSsoPrompt', () => {
    const sleep = promisify(setTimeout);

    const clientId = 'fake_client_id';
    const clientSecret = 'fake_client_secret';
    const tenantId = 'fake_tenant';
    const initiateLoginEndpoint = 'fake_initiate_login_endpoint';

    const TeamsBotSsoPromptId = 'TEAMS_BOT_SSO_PROMPT';
    const requiredScopes: string[] = ['User.Read'];
    const invokeResponseActivityType = 'invokeResponse';
    const id = 'fake_id';
    const exchangeToken = 'fake_exchange_token';

    /**
     * {
     * "aud": "test_audience",
     * "iss": "https://login.microsoftonline.com/test_aad_id/v2.0",
     * "iat": 1537231048,
     * "nbf": 1537231048,
     * "exp": 1537234948,
     * "aio": "test_aio",
     * "name": "Teams App Framework SDK Unit Test",
     * "oid": "11111111-2222-3333-4444-555555555555",
     * "preferred_username": "test@microsoft.com",
     * "rh": "test_rh",
     * "scp": "access_as_user",
     * "sub": "test_sub",
     * "tid": "test_tenant_id",
     * "uti": "test_uti",
     * "ver": "2.0"
     * }
     */
    const ssoToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ0ZXN0X2F1ZGllbmNlIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tL3Rlc3RfYWFkX2lkL3YyLjAiLCJpYXQiOjE1MzcyMzEwNDgsIm5iZiI6MTUzNzIzMTA0OCwiZXhwIjoxNTM3MjM0OTQ4LCJhaW8iOiJ0ZXN0X2FpbyIsIm5hbWUiOiJNT0RTIFRvb2xraXQgU0RLIFVuaXQgVGVzdCIsIm9pZCI6IjExMTExMTExLTIyMjItMzMzMy00NDQ0LTU1NTU1NTU1NTU1NSIsInByZWZlcnJlZF91c2VybmFtZSI6InRlc3RAbWljcm9zb2Z0LmNvbSIsInJoIjoidGVzdF9yaCIsInNjcCI6ImFjY2Vzc19hc191c2VyIiwic3ViIjoidGVzdF9zdWIiLCJ0aWQiOiJ0ZXN0X3RlbmFudF9pZCIsInV0aSI6InRlc3RfdXRpIiwidmVyIjoiMi4wIn0.SshbL1xuE1aNZD5swrWOQYgTR9QCNXkZqUebautBvKM';
    const tokenExpiration = '2023-01-01T00:00:00.000Z';
    const timeoutValue = 50;
    const sleepTimeOffset: number = timeoutValue + 20;
    enum SsoLogInResult {
        Success = 'Success',
        Fail = 'Fail'
    }
    const sandbox = sinon.createSandbox();

    beforeEach(function () {
        // Mock onBehalfOfUserCredential implementation
        const msal_acquireTokenOBO = sandbox.stub(ConfidentialClientApplication.prototype, 'acquireTokenOnBehalfOf');
        msal_acquireTokenOBO.onCall(0).throws();
        msal_acquireTokenOBO.onCall(1).callsFake(async () => {
            return Promise.resolve({
                accessToken: exchangeToken,
                expiresOn: new Date(tokenExpiration)
            } as AuthenticationResult);
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('teams bot sso prompt should be able to sign user in and get exchange tokens when consent', async function () {
        this.timeout(500);

        const adapter: TestAdapter = await initializeTestEnv();

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                // Assert bot send out OAuthCard
                assertTeamsSsoOauthCardActivity(activity);

                // Mock Teams sends signin/tokenExchange message with SSO token back to the bot
                mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(adapter, activity);
            })
            .assertReply((activity) => {
                // User has not consent. Assert bot send out 412
                assert.strictEqual(activity.type, invokeResponseActivityType);
                assert.strictEqual(activity.value.status, StatusCodes.PRECONDITION_FAILED);
                assert.strictEqual(
                    activity.value.body.failureDetail,
                    'The bot is unable to exchange token. Ask for user consent.'
                );

                // Mock Teams sends signin/verifyState message after user consent back to the bot
                const invokeActivity: Partial<Activity> = createReply(ActivityTypes.Invoke, activity);
                invokeActivity.name = verifyStateOperationName;
                adapter.send(invokeActivity);
            })
            .assertReply((activity) => {
                // Assert bot send out OAuthCard gain to get SSO token
                assertTeamsSsoOauthCardActivity(activity);

                // Mock Teams sends signin/tokenExchange message with SSO token back to the bot
                mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(adapter, activity);
            })
            .assertReply((activity) => {
                // Assert bot send out invoke response status 200 to Teams to signal verifivation invoke has been received
                assert.strictEqual(activity.type, invokeResponseActivityType);
                assert.strictEqual(activity.value.status, StatusCodes.OK);
            })
            .assertReply((activity) => {
                // Assert bot send out invoke response status 200 to Teams to signal token response request invoke has been received
                assert.strictEqual(activity.type, invokeResponseActivityType);
                assert.strictEqual(activity.value.status, StatusCodes.OK);
                assert.strictEqual(activity.value.body.id, id);
            })
            .assertReply(SsoLogInResult.Success)
            .assertReply((activity) => {
                // Assert prompt result has exchanged token and sso token.
                const result = JSON.parse(activity.text as string) as TokenResponse;
                assert.strictEqual(result.token, exchangeToken);
                assert.strictEqual(result.expiration, tokenExpiration);
            });
    });

    it('teams bot sso prompt should timeout with teams verification invoke activity when wait a long time', async function () {
        const adapter: TestAdapter = await initializeTestEnv(timeoutValue);

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                // Assert bot send out OAuthCard
                assertTeamsSsoOauthCardActivity(activity);

                // Mock Teams sends signin/tokenExchange message with SSO token back to the bot
                mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(adapter, activity);
            })
            .assertReply(async (activity) => {
                // User has not consent. Assert bot send out 412
                assert.strictEqual(activity.type, invokeResponseActivityType);
                assert.strictEqual(activity.value.status, StatusCodes.PRECONDITION_FAILED);
                assert.strictEqual(
                    activity.value.body.failureDetail,
                    'The bot is unable to exchange token. Ask for user consent.'
                );

                await sleep(sleepTimeOffset);

                // Mock Teams sends signin/verifyState message after user consent back to the bot after timeout
                const invokeActivity: Partial<Activity> = createReply(ActivityTypes.Invoke, activity);
                invokeActivity.name = verifyStateOperationName;
                adapter.send(invokeActivity);
            })
            .assertReply(SsoLogInResult.Fail);
    });

    it('teams bot sso prompt should timeout with token exchange activity when wait a long time', async function () {
        const adapter: TestAdapter = await initializeTestEnv(timeoutValue);

        await adapter
            .send('Hello')
            .assertReply(async (activity) => {
                // Assert bot send out OAuthCard
                assertTeamsSsoOauthCardActivity(activity);

                await sleep(sleepTimeOffset);

                // Mock Teams sends signin/tokenExchange message with SSO token back to the bot
                mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(adapter, activity);
            })
            .assertReply(SsoLogInResult.Fail);
    });

    it('teams bot sso prompt should timeout with message activity when wait a long time', async function () {
        const adapter: TestAdapter = await initializeTestEnv(timeoutValue);

        await adapter
            .send('Hello')
            .assertReply(async (activity) => {
                // Assert bot send out OAuthCard
                assertTeamsSsoOauthCardActivity(activity);

                await sleep(sleepTimeOffset);

                // Mock message activity sent to the bot
                const messageActivity: Partial<Activity> = createReply(ActivityTypes.Message, activity);
                messageActivity.text = 'message sent to bot.';
                adapter.send(messageActivity);
            })
            .assertReply(SsoLogInResult.Fail);
    });

    it('teams bot sso prompt should end on invalid message when endOnInvalidMessage default to true', async function () {
        const adapter: TestAdapter = await initializeTestEnv(undefined);

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                // Assert bot send out OAuthCard
                assertTeamsSsoOauthCardActivity(activity);

                // Mock User send invalid message
                const messageActivity = createReply(ActivityTypes.Message, activity);
                messageActivity.text = 'user sends invalid message during auth flow';
                adapter.send(messageActivity);
            })
            .assertReply(SsoLogInResult.Fail);
    });

    it('teams bot sso prompt should not end on invalid message when endOnInvalidMessage set to false', async function () {
        const adapter: TestAdapter = await initializeTestEnv(undefined, false);

        await adapter
            .send('Hello')
            .assertReply((activity) => {
                // Assert bot send out OAuthCard
                assertTeamsSsoOauthCardActivity(activity);

                // Mock User send invalid message, wchich should be ignored.
                const messageActivity = createReply(ActivityTypes.Message, activity);
                messageActivity.text = 'user sends invalid message during auth flow';
                adapter.send(messageActivity);

                // Mock Teams sends signin/tokenExchange message with SSO token back to the bot
                mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(adapter, activity);
            })
            .assertReply((activity) => {
                // User has not consent. Assert bot send out 412
                assert.strictEqual(activity.type, invokeResponseActivityType);
                assert.strictEqual(activity.value.status, StatusCodes.PRECONDITION_FAILED);
                assert.strictEqual(
                    activity.value.body.failureDetail,
                    'The bot is unable to exchange token. Ask for user consent.'
                );

                // Mock Teams sends signin/verifyState message after user consent back to the bot
                const invokeActivity: Partial<Activity> = createReply(ActivityTypes.Invoke, activity);
                invokeActivity.name = verifyStateOperationName;
                adapter.send(invokeActivity);
            })
            .assertReply((activity) => {
                // Assert bot send out OAuthCard gain to get SSO token
                assertTeamsSsoOauthCardActivity(activity);

                // Mock Teams sends signin/tokenExchange message with SSO token back to the bot
                mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(adapter, activity);
            })
            .assertReply((activity) => {
                // Assert bot send out invoke response status 200 to Teams to signal verifivation invoke has been received
                assert.strictEqual(activity.type, invokeResponseActivityType);
                assert.strictEqual(activity.value.status, StatusCodes.OK);
            })
            .assertReply((activity) => {
                // Assert bot send out invoke response status 200 to Teams to signal token response request invoke has been received
                assert.strictEqual(activity.type, invokeResponseActivityType);
                assert.strictEqual(activity.value.status, StatusCodes.OK);
                assert.strictEqual(activity.value.body.id, id);
            })
            .assertReply(SsoLogInResult.Success)
            .assertReply((activity) => {
                // Assert prompt result has exchanged token and sso token.
                const result = JSON.parse(activity.text as string) as TokenResponse;
                assert.strictEqual(result.token, exchangeToken);
                assert.strictEqual(result.expiration, tokenExpiration);
            });
    });

    it('teams bot sso prompt should only work in MS Teams Channel', async function () {
        const adapter: TestAdapter = await initializeTestEnv(undefined, undefined, Channels.Test);

        await adapter.send('Hello').catch((error) => {
            assert.strictEqual(error.message, 'Teams Bot SSO Prompt is only supported in MS Teams Channel');
        });
    });

    /**
     *
     * @param {ActivityTypes} type - The activity type.
     * @param {Partial<Activity>} activity - The activity to use for the turn context.
     * @returns {Partial<Activity>} - The created reply activity.
     */
    function createReply(type: ActivityTypes, activity: Partial<Activity>): Partial<Activity> {
        return {
            type: type,
            from: { id: activity.recipient!.id, name: activity.recipient!.name },
            recipient: { id: activity.from!.id, name: activity.from!.name },
            replyToId: activity.id,
            serviceUrl: activity.serviceUrl,
            channelId: activity.channelId,
            conversation: {
                isGroup: activity.conversation!.isGroup,
                id: activity.conversation!.id,
                name: activity.conversation!.name,
                conversationType: 'personal',
                tenantId: tenantId
            }
        };
    }

    /**
     *
     * @param {Partial<Activity>} activity - The activity to assert.
     */
    function assertTeamsSsoOauthCardActivity(activity: Partial<Activity>): void {
        assert.equal(Array.isArray(activity.attachments), true);
        assert.strictEqual(activity.attachments?.length, 1);
        assert.strictEqual(activity.attachments![0].contentType, CardFactory.contentTypes.oauthCard);
        assert.strictEqual(activity.inputHint, InputHints.AcceptingInput);

        assert.strictEqual(activity.attachments![0].content.buttons[0].type, ActionTypes.Signin);
        assert.strictEqual(activity.attachments![0].content.buttons[0].title, 'Teams SSO Sign In');

        assert.strictEqual(
            activity.attachments![0].content.buttons[0].value,
            `${initiateLoginEndpoint}?scope=${encodeURI(
                requiredScopes.join(' ')
            )}&clientId=${clientId}&tenantId=${tenantId}`
        );
    }

    /**
     *
     * @param {TestAdapter} adapter - The adapter to use for the turn context.
     * @param {Partial<Activity>} activity - The activity to use for the turn context.
     */
    function mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(
        adapter: TestAdapter,
        activity: Partial<Activity>
    ): void {
        const invokeActivity: Partial<Activity> = createReply(ActivityTypes.Invoke, activity);
        invokeActivity.name = tokenExchangeOperationName;
        invokeActivity.value = {
            id: id,
            token: ssoToken
        };
        adapter.send(invokeActivity);
    }

    /**
     * Initialize dialogs, adds teamsBotSsoPrompt in dialog set and initialize testAdapter for test case.
     * @param {number} timeout_value - A positive number set to teamsSsoPromptSettings.timeout property
     * @param {boolean} endOnInvalidMessage - A boolean value set to teamsSsoPromptSettings.endOnInvalidMessage property
     * @param {Channels} channelId - A value set to dialog context activity channel. Defaults to `Channels.MSteams`.
     @returns {Promise<TestAdapter>} - The Test Adapter
     */
    async function initializeTestEnv(
        timeout_value?: number,
        endOnInvalidMessage?: boolean,
        channelId?: Channels
    ): Promise<TestAdapter> {
        // Create new ConversationState with MemoryStorage
        const convoState: ConversationState = new ConversationState(new MemoryStorage());

        // Create a DialogState property, DialogSet and TeamsBotSsoPrompt
        const dialogState: StatePropertyAccessor<DialogState> = convoState.createProperty('dialogState');
        const dialogs: DialogSet = new DialogSet(dialogState);
        const settings: TeamsSsoSettings = {
            scopes: requiredScopes,
            signInLink: initiateLoginEndpoint,
            msalConfig: {
                auth: {
                    clientId,
                    clientSecret,
                    authority: `https://login.microsoftonline.com/${tenantId}/`
                }
            },
            timeout: timeout_value,
            endOnInvalidMessage: endOnInvalidMessage
        };

        const msal = new ConfidentialClientApplication(settings.msalConfig);
        dialogs.add(new TeamsSsoPrompt(TeamsBotSsoPromptId, 'test_setting', settings, msal));

        // Initialize TestAdapter.
        const adapter: TestAdapter = new TestAdapter(async (turnContext) => {
            const dc = await dialogs.createContext(turnContext);
            dc.context.activity.channelId = channelId === undefined ? Channels.Msteams : channelId;

            const results = await dc.continueDialog();
            if (results.status === DialogTurnStatus.empty) {
                await dc.beginDialog(TeamsBotSsoPromptId);
            } else if (results.status === DialogTurnStatus.complete) {
                if (results.result?.token) {
                    await turnContext.sendActivity(SsoLogInResult.Success);
                    const resultStr = JSON.stringify(results.result);
                    await turnContext.sendActivity(resultStr);
                } else {
                    await turnContext.sendActivity(SsoLogInResult.Fail);
                }
            }
            await convoState.saveChanges(turnContext);
        });
        return adapter;
    }
});
