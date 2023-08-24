const { MemoryStorage, ConversationState, DialogSet, ActivityTypes, tokenExchangeOperationName } = require("botbuilder-core");
const { DialogTurnStatus } = require("botbuilder-dialogs");
const { TeamsBotSsoPrompt } = require("../src/prompts/teamsBotSsoPrompt");
const { TestAdapter } = require("@microsoft/teams-core");
const assert = require('assert');

describe('TeamsBotSsoPrompt', function () {
    this.timeout(500);

    it('should call TeamsBotSsoPrompt using dc.prompt().', async function () {
      const adapter = await initializeTestEnv();
      await adapter
        .send("Hello")
        .assertReply((activity) => {
          assertTeamsSsoOauthCardActivity(activity);
          mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(adapter, activity);
        })
        .assertReply((activity) => {
          // User has not consent. Assert bot send out 412
          assert.strictEqual(activity.type, invokeResponseActivityType);
          assert.strictEqual(activity.value.status, StatusCodes.PRECONDITION_FAILED);
          assert.strictEqual(
            activity.value.body.failureDetail,
            "The bot is unable to exchange token. Ask for user consent."
          );
    
          // Mock Teams sends signin/verifyState message after user consent back to the bot
          const invokeActivity = createReply(ActivityTypes.Invoke, activity);
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
          const result = JSON.parse(activity.text);
          assert.strictEqual(result.token, exchangeToken);
          assert.strictEqual(result.ssoToken, ssoToken);
          assert.strictEqual(result.ssoTokenExpiration, ssoTokenExpiration);
        });
    });

    it('should timeout with teams verification invoke activity when wait a long time', async function () {
      const adapter = await initializeTestEnv(timeoutValue);

      await adapter
        .send("Hello")
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
            "The bot is unable to exchange token. Ask for user consent."
          );

          await sleep(sleepTimeOffset);

          // Mock Teams sends signin/verifyState message after user consent back to the bot after timeout
          const invokeActivity = createReply(ActivityTypes.Invoke, activity);
          invokeActivity.name = verifyStateOperationName;
          adapter.send(invokeActivity);
        })
        .assertReply(SsoLogInResult.Fail);
    });

    it("should timeout with message activity when wait a long time", async function () {
      const adapter = await initializeTestEnv(timeoutValue);
  
      await adapter
        .send("Hello")
        .assertReply(async (activity) => {
          // Assert bot send out OAuthCard
          assertTeamsSsoOauthCardActivity(activity);
  
          await sleep(sleepTimeOffset);
  
          // Mock message activity sent to the bot
          const messageActivity = createReply(ActivityTypes.Message, activity);
          messageActivity.text = "message sent to bot.";
          adapter.send(messageActivity);
        })
        .assertReply(SsoLogInResult.Fail);
    });

    it("should end on invalid message when endOnInvalidMessage default to true", async function () {
      const adapter = await initializeTestEnv(undefined);
  
      await adapter
        .send("Hello")
        .assertReply((activity) => {
          // Assert bot send out OAuthCard
          assertTeamsSsoOauthCardActivity(activity);
  
          // Mock User send invalid message
          const messageActivity = createReply(ActivityTypes.Message, activity);
          messageActivity.text = "user sends invalid message during auth flow";
          adapter.send(messageActivity);
        })
        .assertReply(SsoLogInResult.Fail);
    });

    it("should not end on invalid message when endOnInvalidMessage set to false", async function () {
      const adapter = await initializeTestEnv(undefined, false);
  
      await adapter
        .send("Hello")
        .assertReply((activity) => {
          // Assert bot send out OAuthCard
          assertTeamsSsoOauthCardActivity(activity);
  
          // Mock User send invalid message, wchich should be ignored.
          const messageActivity = createReply(ActivityTypes.Message, activity);
          messageActivity.text = "user sends invalid message during auth flow";
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
            "The bot is unable to exchange token. Ask for user consent."
          );
  
          // Mock Teams sends signin/verifyState message after user consent back to the bot
          const invokeActivity = createReply(ActivityTypes.Invoke, activity);
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
          const result = JSON.parse(activity.text);
          assert.strictEqual(result.token, exchangeToken);
          assert.strictEqual(result.ssoToken, ssoToken);
          assert.strictEqual(result.ssoTokenExpiration, ssoTokenExpiration);
        });
    });

    it("should only work in MS Teams Channel", async function () {
      const adapter = await initializeTestEnv(undefined, undefined, Channels.Test);
  
      await adapter.send("Hello").catch((error) => {
        assert.strictEqual(
          error.message,
          "Teams Bot SSO Prompt is only supported in MS Teams Channel"
        );
      });
    });

    it("should work with undefined user Principal Name", async function () {
      getMemberStub.restore();
      sandbox.stub(TeamsInfo, "getMember").callsFake(async () => {
        const account = {
          id: "fake_id",
          name: "fake_name",
          userPrincipalName: "",
        };
        return account;
      });
      const adapter = await initializeTestEnv();
  
      await adapter.send("Hello").assertReply((activity) => {
        // Assert bot send out OAuthCard
        assert.strictEqual(
          activity.attachments[0].content.buttons[0].value,
          `${initiateLoginEndpoint}?scope=${encodeURI(
            requiredScopes.join(" ")
          )}&clientId=${clientId}&tenantId=${tenantId}&loginHint=`
        );
      });
    });
});

async function initializeTestEnv(timeout_value, endOnInvalidMessage, channelId,)
{
    const convoState = new ConversationState(new MemoryStorage());
    const dialogState = convoState.createProperty("dialogState");
    const dialogs = new DialogSet(dialogState);
    const settings = {
        scopes: requiredScopes,
        timeout: timeout_value,
        endOnInvalidMessage: endOnInvalidMessage,
    };
    const authConfig = {
        authorityHost: "fake_authority_host",
        clientId: "fake_client_id",
        tenantId: "fake_tenant_id",
        clientSecret: "fake_client_secret",
    };
    dialogs.add(
        new TeamsBotSsoPrompt(authConfig, "fake_initiate_login_endpoint", "TeamsBotSsoPrompt", settings)
    );

    const adapter = new TestAdapter(async (turnContext) => {
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
    });

    return adapter;
}

function createReply(type, activity) {
  return {
    type: type,
    from: { id: activity.recipient.id, name: activity.recipient.name },
    recipient: { id: activity.from.id, name: activity.from.name },
    replyToId: activity.id,
    serviceUrl: activity.serviceUrl,
    channelId: activity.channelId,
    conversation: {
      isGroup: activity.conversation.isGroup,
      id: activity.conversation.id,
      name: activity.conversation.name,
      conversationType: "personal",
      tenantId: "fake_tenant_id",
    },
  };
}

function mockTeamsSendsTokenExchangeInvokeActivityWithSsoToken(adapter, activity) {
  const invokeActivity = createReply(ActivityTypes.Invoke, activity);
  invokeActivity.name = tokenExchangeOperationName;
  invokeActivity.value = {
    id: "fake_id",
    token: ssoToken,
  };
  adapter.send(invokeActivity);
}

function assertTeamsSsoOauthCardActivity(activity) {
  assert.isArray(activity.attachments);
  assert.strictEqual(activity.attachments?.length, 1);
  assert.strictEqual(activity.attachments[0].contentType, CardFactory.contentTypes.oauthCard);
  assert.strictEqual(activity.inputHint, InputHints.AcceptingInput);

  assert.strictEqual(activity.attachments[0].content.buttons[0].type, ActionTypes.Signin);
  assert.strictEqual(activity.attachments[0].content.buttons[0].title, "Teams SSO Sign In");

  assert.strictEqual(
    activity.attachments[0].content.buttons[0].value,
    `${initiateLoginEndpoint}?scope=${encodeURI(
      requiredScopes.join(" ")
    )}&clientId=${clientId}&tenantId=${tenantId}&loginHint=${userPrincipalName}`
  );
}