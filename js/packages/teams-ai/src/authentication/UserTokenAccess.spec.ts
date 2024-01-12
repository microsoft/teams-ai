import { Activity, TestAdapter, TokenResponse, TurnContext } from 'botbuilder';
import { SignInUrlResponse, TokenExchangeRequest, TokenStatus, UserTokenClient } from 'botframework-connector';
import Sinon, * as sinon from 'sinon';
import { exchangeToken, getSignInResource, getUserToken, signOutUser } from './UserTokenAccess';
import assert from 'assert';

describe('UserTokenAccess', () => {
    let context: TurnContext;
    let contextWithNoClient: TurnContext;
    let userTokenClient: TestUserTokenClient;
    let userTokenClientStub: Sinon.SinonStub;

    beforeEach(() => {
        context = new TurnContext(new TestAdapter(), {});
        userTokenClient = new TestUserTokenClient();
        userTokenClientStub = sinon.stub(context.turnState, 'get').returns(userTokenClient);
        contextWithNoClient = new TurnContext(new TestAdapter(), {});
        sinon.stub(contextWithNoClient.turnState, 'get').returns(null);
    });

    it('valid getUserToken', async () => {
        await getUserToken(context, { title: 'title', connectionName: 'test' }, '1234');

        assert(userTokenClientStub.calledOnce);
        assert(userTokenClient.lastMethodCalled === 'getUserToken');
    });

    it('should throw error for getUserToken due to empty token client', async () => {
        await assert.rejects(
            () => getUserToken(contextWithNoClient, { title: 'title', connectionName: 'test' }, '1234'),
            new Error(`OAuth prompt is not supported by the current adapter`)
        );
    });

    it('valid getSignInResource', async () => {
        await getSignInResource(context, { title: 'title', connectionName: 'test' });

        assert(userTokenClientStub.calledOnce);
        assert(userTokenClient.lastMethodCalled === 'getSignInResource');
    });

    it('should throw error for getSignInResource due to empty token client', async () => {
        await assert.rejects(
            () => getSignInResource(contextWithNoClient, { title: 'title', connectionName: 'test' }),
            new Error(`OAuth prompt is not supported by the current adapter`)
        );
    });

    it('valid signOutUser', async () => {
        await signOutUser(context, { title: 'title', connectionName: 'test' });

        assert(userTokenClientStub.calledOnce);
        assert(userTokenClient.lastMethodCalled === 'signOutUser');
    });

    it('should throw error for signOutUser due to empty token client', async () => {
        await assert.rejects(
            () => signOutUser(contextWithNoClient, { title: 'title', connectionName: 'test' }),
            new Error(`OAuth prompt is not supported by the current adapter`)
        );
    });

    it('valid exchangeToken', async () => {
        await exchangeToken(context, { title: 'title', connectionName: 'test' }, {});

        assert(userTokenClientStub.calledOnce);
        assert(userTokenClient.lastMethodCalled === 'exchangeToken');
    });

    it('should throw error for exchangeToken due to empty token client', async () => {
        await assert.rejects(
            () => exchangeToken(contextWithNoClient, { title: 'title', connectionName: 'test' }, {}),
            new Error(`OAuth prompt is not supported by the current adapter`)
        );
    });
});

class TestUserTokenClient implements UserTokenClient {
    public lastMethodCalled: string;

    constructor() {
        this.lastMethodCalled = '';
    }

    public getUserToken(
        userId: string,
        connectionName: string,
        channelId: string,
        magicCode: string
    ): Promise<TokenResponse> {
        this.lastMethodCalled = 'getUserToken';
        return Promise.resolve({} as TokenResponse);
    }
    public getSignInResource(
        connectionName: string,
        activity: Activity,
        finalRediect: string
    ): Promise<SignInUrlResponse> {
        this.lastMethodCalled = 'getSignInResource';
        return Promise.resolve({} as SignInUrlResponse);
    }
    public signOutUser(userId: string, connectionName: string, channelId: string): Promise<void> {
        this.lastMethodCalled = 'signOutUser';
        return Promise.resolve();
    }
    public getTokenStatus(userId: string, channelId: string, includeFilter: string): Promise<TokenStatus[]> {
        this.lastMethodCalled = 'getTokenStatus';
        return Promise.resolve([]);
    }
    public getAadTokens(
        userId: string,
        connectionName: string,
        resourceUrls: string[],
        channelId: string
    ): Promise<Record<string, TokenResponse>> {
        this.lastMethodCalled = 'getAadTokens';
        return Promise.resolve({});
    }
    public exchangeToken(
        userId: string,
        connectionName: string,
        channelId: string,
        exchangeRequest: TokenExchangeRequest
    ): Promise<TokenResponse> {
        this.lastMethodCalled = 'exchangeToken';
        return Promise.resolve({} as TokenResponse);
    }
}
