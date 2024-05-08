// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Activity, MemoryStorage, TestAdapter, TurnContext } from 'botbuilder';
import * as sinon from 'sinon';
import assert from 'assert';
import { Application, RouteSelector } from '../Application';
import { TeamsSsoPrompt } from './TeamsBotSsoPrompt';
import { TeamsSsoSettings } from './TeamsSsoSettings';
import { TurnState } from '../TurnState';
import { TeamsSsoBotAuthentication } from './TeamsSsoBotAuthentication';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { DialogContext, DialogTurnStatus } from 'botbuilder-dialogs';

describe('TeamsSsoBotAuthentication', () => {
    const adapter = new TestAdapter();

    let app: Application;
    let settings: TeamsSsoSettings;
    const settingName = 'settingName';

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

    beforeEach(() => {
        app = new Application();
        settings = {
            scopes: ['User.Read'],
            msalConfig: {
                auth: {
                    clientId: 'test',
                    clientSecret: 'test',
                    authority: 'https://login.microsoftonline.com/common'
                }
            },
            signInLink: 'https://localhost/auth-start.html'
        };

        sinon.stub(app, 'adapter').get(() => adapter);
    });

    describe('constructor()', () => {
        it('should register afterTurn to skip state saving for duplicate token exchange activity', async () => {
            const appSpy = sinon.stub(app, 'turn');

            let afterTurnHandler;

            appSpy.callsFake((event, handler) => {
                afterTurnHandler = handler;

                return app;
            });

            // Act
            const msal = new ConfidentialClientApplication(settings.msalConfig);
            new TeamsSsoBotAuthentication(app, settings, settingName, msal);

            const [context, state] = await createTurnContextAndState({ type: 'invoke', name: 'signin/tokenExchange' });

            state.temp.duplicateTokenExchange = true;

            assert(appSpy.calledOnce);
            assert.equal(await afterTurnHandler!(context, state), false); // Return false to prevent state to be saved
        });

        it('should register route to handle signin/verifyState', async () => {
            const appSpy = sinon.stub(app, 'addRoute');

            const selectors: RouteSelector[] = [];

            appSpy.callsFake((selector) => {
                selectors.push(selector);

                return app;
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            new TeamsSsoBotAuthentication(app, settings, settingName, msal);

            const context = new TurnContext(adapter, {
                type: 'invoke',
                name: 'signin/verifyState',
                value: {
                    settingName: settingName
                }
            });

            assert(await selectors[0](context)); // The first selector is for signin/verifyState
        });

        it('should register route to handle signin/tokenExchange', async () => {
            const appSpy = sinon.stub(app, 'addRoute');

            const selectors: RouteSelector[] = [];

            appSpy.callsFake((selector) => {
                selectors.push(selector);

                return app;
            });

            const msal = new ConfidentialClientApplication(settings.msalConfig);
            new TeamsSsoBotAuthentication(app, settings, settingName, msal);

            const context = new TurnContext(adapter, {
                type: 'invoke',
                name: 'signin/tokenExchange',
                value: { id: `00000000-0000-0000-0000-000000000000-${settingName}`, settingName: settingName }
            });

            assert(await selectors[1](context)); // The second selector is for signin/tokenExchange
        });
    });

    describe('runDialog()', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should begin the dialog if it is not already started', async () => {
            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoBotAuthentication(app, settings, settingName, msal);

            const [context, state] = await createTurnContextAndState({ type: 'message' });

            sinon.stub(DialogContext.prototype, 'continueDialog').resolves({ status: DialogTurnStatus.empty });
            const beginDialogSpy = sinon
                .stub(DialogContext.prototype, 'beginDialog')
                .resolves({ status: DialogTurnStatus.waiting });

            const result = await auth.runDialog(context, state, 'dialogState');

            assert(beginDialogSpy.calledOnce);
            assert.strictEqual(result.status, DialogTurnStatus.waiting);
        });

        it('should continue the dialog if it is already started', async () => {
            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoBotAuthentication(app, settings, settingName, msal);

            const [context, state] = await createTurnContextAndState({ type: 'message' });

            sinon.stub(DialogContext.prototype, 'beginDialog').resolves({ status: DialogTurnStatus.waiting });
            const continueDialogSpy = sinon
                .stub(DialogContext.prototype, 'continueDialog')
                .resolves({ status: DialogTurnStatus.complete });

            const result = await auth.runDialog(context, state, 'dialogState');

            assert(continueDialogSpy.calledOnce);
            assert.strictEqual(result.status, DialogTurnStatus.complete);
        });
    });

    describe('continueDialog()', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should continue the dialog', async () => {
            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoBotAuthentication(app, settings, settingName, msal);

            const [context, state] = await createTurnContextAndState({
                type: 'invoke',
                name: 'signin/tokenExchange',
                value: { id: `00000000-0000-0000-0000-000000000000-${settingName}` }
            });

            sinon.stub(DialogContext.prototype, 'continueDialog').resolves({ status: DialogTurnStatus.complete });
            const beginDialogSpy = sinon
                .stub(DialogContext.prototype, 'beginDialog')
                .resolves({ status: DialogTurnStatus.waiting });

            const result = await auth.continueDialog(context, state, 'dialogState');

            assert.strictEqual(result.status, DialogTurnStatus.complete);
            assert(beginDialogSpy.notCalled);
        });
    });

    describe('dedupe', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should dedupe if received multiple token exchange activity with same id', async () => {
            const msal = new ConfidentialClientApplication(settings.msalConfig);
            const auth = new TeamsSsoBotAuthentication(app, settings, settingName, msal);

            // const [, state] = await createTurnContextAndState({ type: 'invoke', name: 'signin/tokenExchange', value: { id: `00000000-0000-0000-0000-000000000000` } });

            sinon.stub(TeamsSsoPrompt.prototype, 'beginDialog').resolves({ status: DialogTurnStatus.waiting });
            sinon.stub(TeamsSsoPrompt.prototype, 'continueDialog').callsFake(async (dc) => {
                return await dc.endDialog({
                    status: DialogTurnStatus.complete,
                    result: { connectionName: '', token: '', expiration: '' }
                });
            });

            const storage = new MemoryStorage();

            const adapter = new TestAdapter(async (turnContext) => {
                const state: TurnState = new TurnState();
                await state.load(turnContext, storage);
                const result = await auth.runDialog(turnContext, state, 'dialogState');
                const resultStr = JSON.stringify(result);
                await turnContext.sendActivity(resultStr);
                await state.save(turnContext, storage);
            });

            /**
             *
             * @param {Partial<Activity>} msg - The message to check
             * @param {string} expected - The expected message
             */
            function assertResponse(msg: Partial<Activity>, expected: string) {
                const response = JSON.parse(msg.text!);
                assert.equal(response.status, expected);
            }

            await adapter
                .send('hi')
                .assertReply((msg) => {
                    assertResponse(msg, 'waiting');
                })
                .send({
                    type: 'invoke',
                    name: 'signin/tokenExchange',
                    value: { id: `00000000-0000-0000-0000-000000000000-${settingName}` }
                })
                .assertReply((msg) => {
                    assertResponse(msg, 'complete');
                })
                .send('hi')
                .assertReply((msg) => {
                    assertResponse(msg, 'waiting');
                })
                .send({
                    type: 'invoke',
                    name: 'signin/tokenExchange',
                    value: { id: `00000000-0000-0000-0000-000000000000-${settingName}` }
                }) // Repeat with same id on purpose to simulate multiple token exchange activities
                .assertReply((msg) => {
                    assertResponse(msg, 'waiting');
                });
        });
    });
});
