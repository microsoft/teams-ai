/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as z from 'zod';
import { BotFrameworkHttpAdapter } from './botFrameworkHttpAdapter';
import { ConnectorClientBuilder, Request, Response, ResponseT, WebRequest, WebResponse } from './interfaces';
import { HttpClient, RequestPolicyFactory, userAgentPolicy } from '@azure/ms-rest-js';
import { INodeBufferT, INodeSocketT, LogicT } from './zod';
import { arch, release, type } from 'os';
import { delay, retry } from './internals';
import { validateAndFixActivity } from './activityValidator';

import {
    Activity,
    ActivityEventNames,
    ActivityTypes,
    CallerIdConstants,
    ChannelAccount,
    Channels,
    ConversationParameters,
    ConversationReference,
    ConversationsResult,
    DeliveryModes,
    ExpectedReplies,
    InvokeResponse,
    ResourceResponse,
    StatusCodes,
    TokenResponse,
} from '@microsoft/teams-connector/src/schema';

import {
    AppCredentials,
    AuthenticationConfiguration,
    AuthenticationConstants,
    AuthenticationError,
    CertificateAppCredentials,
    ChannelValidation,
    Claim,
    ClaimsIdentity,
    ConnectorClient,
    ConnectorClientOptions,
    EmulatorApiClient,
    GovernmentChannelValidation,
    GovernmentConstants,
    JwtTokenValidation,
    MicrosoftAppCredentials,
    SignInUrlResponse,
    SimpleCredentialProvider,
    SkillValidation,
    TokenApiClient,
    TokenApiModels,
    TokenExchangeRequest,
    TokenStatus,
} from '@microsoft/teams-connector';

import {
    INodeBuffer,
    INodeSocket,
    IReceiveRequest,
    ISocket,
    IStreamingTransportServer,
    NamedPipeServer,
    NodeWebSocketFactory,
    NodeWebSocketFactoryBase,
    RequestHandler,
    StreamingResponse,
    WebSocketServer,
} from 'botframework-streaming';

import {
    defaultPipeName,
    GET,
    POST,
    MESSAGES_PATH,
    StreamingHttpClient,
    TokenResolver,
    VERSION_PATH,
} from './streaming';
import { BotAdapter } from './botAdapter';
import { ExtendedUserTokenProvider } from './extendedUserTokenProvider';
import { BotCallbackHandlerKey, TurnContext } from './turnContext';
import { CoreAppCredentials } from './coreAppCredentials';
import { INVOKE_RESPONSE_KEY } from './activityHandlerBase';

/**
 * @deprecated Use `CloudAdapter` with `ConfigurationBotFrameworkAuthentication` instead to configure bot runtime.
 * Contains settings used to configure a [BotFrameworkAdapter](xref:botbuilder.BotFrameworkAdapter) instance.
 */
export interface BotFrameworkAdapterSettings {
    /**
     * The ID assigned to your bot in the [Bot Framework Portal](https://dev.botframework.com/).
     */
    appId: string;

    /**
     * The password assigned to your bot in the [Bot Framework Portal](https://dev.botframework.com/).
     */
    appPassword: string;

    /**
     * Optional. The tenant to acquire the bot-to-channel token from.
     */
    channelAuthTenant?: string;

    /**
     * Optional. The OAuth API endpoint for your bot to use.
     */
    oAuthEndpoint?: string;

    /**
     * Optional. The OpenID Metadata endpoint for your bot to use.
     */
    openIdMetadata?: string;

    /**
     * Optional. The channel service option for this bot to validate connections from Azure or other channel locations.
     */
    channelService?: string;

    /**
     * Optional. Used to pass in a NodeWebSocketFactoryBase instance.
     */
    webSocketFactory?: NodeWebSocketFactoryBase;

    /**
     * Optional. Certificate thumbprint to authenticate the appId against AAD.
     */
    certificateThumbprint?: string;

    /**
     * Optional. Certificate key to authenticate the appId against AAD.
     */
    certificatePrivateKey?: string;

    /**
     * Optional. Used to require specific endorsements and verify claims. Recommended for Skills.
     */
    authConfig?: AuthenticationConfiguration;

    /**
     * Optional. Used when creating new ConnectorClients.
     */
    clientOptions?: ConnectorClientOptions;
}

// Retrieve additional information, i.e., host operating system, host OS release, architecture, Node.js version
const ARCHITECTURE = arch();
const TYPE = type();
const RELEASE = release();
const NODE_VERSION = process.version;

const pjson: Record<'version', string> = require('../package.json'); // eslint-disable-line @typescript-eslint/no-var-requires
export const USER_AGENT = `Microsoft-BotFramework/3.1 BotBuilder/${pjson.version} (Node.js,Version=${NODE_VERSION}; ${TYPE} ${RELEASE}; ${ARCHITECTURE})`;

const OAUTH_ENDPOINT = 'https://api.botframework.com';
const US_GOV_OAUTH_ENDPOINT = 'https://api.botframework.azure.us';

/**
 * A [BotAdapter](xref:botbuilder-core.BotAdapter) that can connect a bot to a service endpoint.
 * Implements [IUserTokenProvider](xref:botbuilder-core.IUserTokenProvider).
 *
 * @remarks
 * The bot adapter encapsulates authentication processes and sends activities to and receives
 * activities from the Bot Connector Service. When your bot receives an activity, the adapter
 * creates a turn context object, passes it to your bot application logic, and sends responses
 * back to the user's channel.
 *
 * The adapter processes and directs incoming activities in through the bot middleware pipeline to
 * your bot logic and then back out again. As each activity flows in and out of the bot, each
 * piece of middleware can inspect or act upon the activity, both before and after the bot logic runs.
 * Use the [use](xref:botbuilder-core.BotAdapter.use) method to add [Middleware](xref:botbuilder-core.Middleware)
 * objects to your adapter's middleware collection.
 *
 * For more information, see the articles on
 * [How bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
 * [Middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware).
 *
 * For example:
 * ```JavaScript
 * const { BotFrameworkAdapter } = require('botbuilder');
 *
 * const adapter = new BotFrameworkAdapter({
 *     appId: process.env.MicrosoftAppId,
 *     appPassword: process.env.MicrosoftAppPassword
 * });
 *
 * adapter.onTurnError = async (context, error) => {
 *     // Catch-all logic for errors.
 * };
 * ```
 */

/**
 * @deprecated Use `CloudAdapter` instead.
 */
export class BotFrameworkAdapter
    extends BotAdapter
    implements BotFrameworkHttpAdapter, ConnectorClientBuilder, ExtendedUserTokenProvider, RequestHandler {
    // These keys are public to permit access to the keys from the adapter when it's a being
    // from library that does not have access to static properties off of BotFrameworkAdapter.
    // E.g. botbuilder-dialogs
    readonly TokenApiClientCredentialsKey: symbol = Symbol('TokenApiClientCredentials');

    protected readonly credentials: AppCredentials;
    protected readonly credentialsProvider: SimpleCredentialProvider;
    protected readonly settings: BotFrameworkAdapterSettings;

    private isEmulatingOAuthCards: boolean;

    // Streaming-specific properties:
    private logic: (context: TurnContext) => Promise<void> = (context) => Promise.resolve();
    private streamingServer: IStreamingTransportServer|undefined;
    private webSocketFactory: NodeWebSocketFactoryBase|undefined;

    private authConfiguration: AuthenticationConfiguration;

    private namedPipeName?: string;

    /**
     * Creates a new instance of the [BotFrameworkAdapter](xref:botbuilder.BotFrameworkAdapter) class.
     *
     * @param settings Optional. The settings to use for this adapter instance.
     *
     * @remarks
     * If the `settings` parameter does not include
     * [channelService](xref:botbuilder.BotFrameworkAdapterSettings.channelService) or
     * [openIdMetadata](xref:botbuilder.BotFrameworkAdapterSettings.openIdMetadata) values, the
     * constructor checks the process' environment variables for these values. These values may be
     * set when a bot is provisioned on Azure and if so are required for the bot to work properly
     * in the global cloud or in a national cloud.
     *
     * The [BotFrameworkAdapterSettings](xref:botbuilder.BotFrameworkAdapterSettings) class defines
     * the available adapter settings.
     */
    constructor(settings?: Partial<BotFrameworkAdapterSettings>) {
        super();
        this.settings = { appId: '', appPassword: '', ...settings };

        // If settings.certificateThumbprint & settings.certificatePrivateKey are provided,
        // use CertificateAppCredentials.
        if (this.settings.certificateThumbprint && this.settings.certificatePrivateKey) {
            this.credentials = new CertificateAppCredentials(
                this.settings.appId,
                this.settings.certificateThumbprint,
                this.settings.certificatePrivateKey,
                this.settings.channelAuthTenant
            );
            this.credentialsProvider = new SimpleCredentialProvider(this.credentials.appId, '');
        } else {
            this.credentials = new MicrosoftAppCredentials(
                this.settings.appId,
                this.settings.appPassword || '',
                this.settings.channelAuthTenant
            );
            this.credentialsProvider = new SimpleCredentialProvider(
                this.credentials.appId,
                this.settings.appPassword || ''
            );
        }

        this.isEmulatingOAuthCards = false;

        // If no channelService or openIdMetadata values were passed in the settings, check the process' Environment Variables for values.
        // These values may be set when a bot is provisioned on Azure and if so are required for the bot to properly work in Public Azure or a National Cloud.
        this.settings.channelService =
            this.settings.channelService || process.env[AuthenticationConstants.ChannelService];
        this.settings.openIdMetadata =
            this.settings.openIdMetadata || process.env[AuthenticationConstants.BotOpenIdMetadataKey];

        this.authConfiguration = this.settings.authConfig || new AuthenticationConfiguration();

        if (this.settings.openIdMetadata) {
            ChannelValidation.OpenIdMetadataEndpoint = this.settings.openIdMetadata;
            GovernmentChannelValidation.OpenIdMetadataEndpoint = this.settings.openIdMetadata;
        }
        if (JwtTokenValidation.isGovernment(this.settings.channelService!)) {
            this.credentials.oAuthEndpoint = GovernmentConstants.ToChannelFromBotLoginUrl;
            this.credentials.oAuthScope = GovernmentConstants.ToChannelFromBotOAuthScope;
        }

        // If a NodeWebSocketFactoryBase was passed in, set it on the BotFrameworkAdapter.
        if (this.settings.webSocketFactory) {
            this.webSocketFactory = this.settings.webSocketFactory;
        }

        // Relocate the tenantId field used by MS Teams to a new location (from channelData to conversation)
        // This will only occur on activities from teams that include tenant info in channelData but NOT in conversation,
        // thus should be future friendly.  However, once the the transition is complete. we can remove this.
        this.use(
            async (context, next): Promise<void> => {
                if (
                    context.activity.channelId === 'msteams' &&
                    context.activity &&
                    context.activity.conversation &&
                    !context.activity.conversation.tenantId &&
                    context.activity.channelData &&
                    context.activity.channelData.tenant
                ) {
                    context.activity.conversation.tenantId = context.activity.channelData.tenant.id;
                }
                await next();
            }
        );
    }

    /**
     * Used in streaming contexts to check if the streaming connection is still open for the bot to send activities.
     *
     * @returns True if the streaming connection is open, otherwise false.
     */
    get isStreamingConnectionOpen(): boolean {
        return this.streamingServer?.isConnected ?? false;
    }

    /**
     * Asynchronously resumes a conversation with a user, possibly after some time has gone by.
     *
     * @param reference A reference to the conversation to continue.
     * @param oAuthScope The intended recipient of any sent activities.
     * @param logic The asynchronous method to call after the adapter middleware runs.
     *
     * @remarks
     * This is often referred to as a _proactive notification_, the bot can proactively
     * send a message to a conversation or user without waiting for an incoming message.
     * For example, a bot can use this method to send notifications or coupons to a user.
     *
     * To send a proactive message:
     * 1. Save a copy of a [ConversationReference](xref:botframework-schema.ConversationReference)
     *    from an incoming activity. For example, you can store the conversation reference in a database.
     * 1. Call this method to resume the conversation at a later time. Use the saved reference to access the conversation.
     * 1. On success, the adapter generates a [TurnContext](xref:botbuilder-core.TurnContext) object and calls the `logic` function handler.
     *    Use the `logic` function to send the proactive message.
     *
     * To copy the reference from any incoming activity in the conversation, use the
     * [TurnContext.getConversationReference](xref:botbuilder-core.TurnContext.getConversationReference) method.
     *
     * This method is similar to the [processActivity](xref:botbuilder.BotFrameworkAdapter.processActivity) method.
     * The adapter creates a [TurnContext](xref:botbuilder-core.TurnContext) and routes it through
     * its middleware before calling the `logic` handler. The created activity will have a
     * [type](xref:botframework-schema.Activity.type) of 'event' and a
     * [name](xref:botframework-schema.Activity.name) of 'continueConversation'.
     *
     * For example:
     * ```JavaScript
     * server.post('/api/notifyUser', async (req, res) => {
     *    // Lookup previously saved conversation reference.
     *    const reference = await findReference(req.body.refId);
     *
     *    // Proactively notify the user.
     *    if (reference) {
     *       await adapter.continueConversation(reference, async (context) => {
     *          await context.sendActivity(req.body.message);
     *       });
     *       res.send(200);
     *    } else {
     *       res.send(404);
     *    }
     * });
     * ```
     */
    async continueConversation(
        reference: Partial<ConversationReference>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * Asynchronously resumes a conversation with a user, possibly after some time has gone by.
     *
     * @param reference [ConversationReference](xref:botframework-schema.ConversationReference) of the conversation to continue.
     * @param oAuthScope The intended recipient of any sent activities or the function to call to continue the conversation.
     * @param logic Optional. The asynchronous method to call after the adapter middleware runs.
     */
    async continueConversation(
        reference: Partial<ConversationReference>,
        oAuthScope: string,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * @internal
     */
    async continueConversation(
        reference: Partial<ConversationReference>,
        oAuthScopeOrlogic: string | ((context: TurnContext) => Promise<void>),
        maybeLogic?: (context: TurnContext) => Promise<void>
    ): Promise<void> {
        let audience: string;
        if (LogicT.check(oAuthScopeOrlogic)) {
            // Because the OAuthScope parameter was not provided, get the correct value via the channelService.
            // In this scenario, the ConnectorClient for the continued conversation can only communicate with
            // official channels, not with other bots.
            audience = JwtTokenValidation.isGovernment(this.settings.channelService!)
                ? GovernmentConstants.ToChannelFromBotOAuthScope
                : AuthenticationConstants.ToChannelFromBotOAuthScope;
        } else {
            audience = z.string().parse(oAuthScopeOrlogic);
        }

        const logic = LogicT.check(oAuthScopeOrlogic) ? oAuthScopeOrlogic : LogicT.parse(maybeLogic);

        let credentials = this.credentials;

        // For authenticated flows (where the bot has an AppId), the ConversationReference's serviceUrl needs
        // to be trusted for the bot to acquire a token when sending activities to the conversation.
        // For anonymous flows, the serviceUrl should not be trusted.
        if (credentials.appId) {
            // If the provided OAuthScope doesn't match the current one on the instance's credentials, create
            // a new AppCredentials with the correct OAuthScope.
            if (credentials.oAuthScope !== audience) {
                // The BotFrameworkAdapter JavaScript implementation supports one Bot per instance, so get
                // the botAppId from the credentials.
                credentials = await this.buildCredentials(credentials.appId, audience);
            }
        }

        const connectorClient = this.createConnectorClientInternal(reference.serviceUrl!, credentials);

        const request = TurnContext.applyConversationReference(
            { type: ActivityTypes.Event, name: ActivityEventNames.ContinueConversation },
            reference,
            true
        );

        const context = this.createContext(request);

        context.turnState.set(this.OAuthScopeKey, audience);
        context.turnState.set(this.ConnectorClientKey, connectorClient);

        await this.runMiddleware(context, logic);
    }

    /**
     * Asynchronously creates and starts a conversation with a user on a channel.
     *
     * @param {Partial<ConversationReference>} reference A reference for the conversation to create.
     * @param {(context: TurnContext) => Promise<void>} logic The asynchronous method to call after the adapter middleware runs.
     * @returns {Promise<void>} a promise representing the asynchronous operation
     *
     * @summary
     * To use this method, you need both the bot's and the user's account information on a channel.
     * The Bot Connector service supports the creating of group conversations; however, this
     * method and most channels only support initiating a direct message (non-group) conversation.
     *
     * To create and start a new conversation:
     * 1. Get a copy of a [ConversationReference](xref:botframework-schema.ConversationReference) from an incoming activity.
     * 1. Set the [user](xref:botframework-schema.ConversationReference.user) property to the
     *    [ChannelAccount](xref:botframework-schema.ChannelAccount) value for the intended recipient.
     * 1. Call this method to request that the channel create a new conversation with the specified user.
     * 1. On success, the adapter generates a turn context and calls the `logic` function handler.
     *
     * To get the initial reference, use the
     * [TurnContext.getConversationReference](xref:botbuilder-core.TurnContext.getConversationReference)
     * method on any incoming activity in the conversation.
     *
     * If the channel establishes the conversation, the generated event activity's
     * [conversation](xref:botframework-schema.Activity.conversation) property will contain the
     * ID of the new conversation.
     *
     * This method is similar to the [processActivity](xref:botbuilder.BotFrameworkAdapter.processActivity) method.
     * The adapter creates a [TurnContext](xref:botbuilder-core.TurnContext) and routes it through
     * middleware before calling the `logic` handler. The created activity will have a
     * [type](xref:botframework-schema.Activity.type) of 'event' and a
     * [name](xref:botframework-schema.Activity.name) of 'createConversation'.
     *
     * For example:
     * ```JavaScript
     * // Get group members conversation reference
     * const reference = TurnContext.getConversationReference(context.activity);
     *
     * // ...
     * // Start a new conversation with the user
     * await adapter.createConversation(reference, async (ctx) => {
     *    await ctx.sendActivity(`Hi (in private)`);
     * });
     * ```
     */
    createConversation(
        reference: Partial<ConversationReference>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * Asynchronously creates and starts a conversation with a user on a channel.
     *
     * @param {Partial<ConversationReference>} reference A reference for the conversation to create.
     * @param {Partial<ConversationParameters>} parameters Parameters used when creating the conversation
     * @param {(context: TurnContext) => Promise<void>} logic The asynchronous method to call after the adapter middleware runs.
     * @returns {Promise<void>} a promise representing the asynchronous operation
     */
    createConversation(
        reference: Partial<ConversationReference>,
        parameters: Partial<ConversationParameters>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * @internal
     */
    async createConversation(
        reference: Partial<ConversationReference>,
        parametersOrLogic: Partial<ConversationParameters> | ((context: TurnContext) => Promise<void>),
        maybeLogic?: (context: TurnContext) => Promise<void>
    ): Promise<void> {
        if (!reference.serviceUrl) {
            throw new Error('BotFrameworkAdapter.createConversation(): missing serviceUrl.');
        }

        const parameters = LogicT.check(parametersOrLogic) ? {} : parametersOrLogic;

        const logic = LogicT.check(parametersOrLogic) ? parametersOrLogic : LogicT.parse(maybeLogic);

        // Create conversation parameters, taking care to provide defaults that can be
        // overridden by passed in parameters
        const conversationParameters = Object.assign(
            {},
            {
                bot: reference.bot,
                members: [reference.user],
                isGroup: false,
                activity: null as any,
                channelData: null as any,
            },
            parameters
        ) as ConversationParameters;

        const client = this.createConnectorClient(reference.serviceUrl);

        // Mix in the tenant ID if specified. This is required for MS Teams.
        if (reference.conversation && reference.conversation.tenantId) {
            // Putting tenantId in channelData is a temporary solution while we wait for the Teams API to be updated
            conversationParameters.channelData = { tenant: { id: reference.conversation.tenantId } };

            // Permanent solution is to put tenantId in parameters.tenantId
            conversationParameters.tenantId = reference.conversation.tenantId;
        }

        const response = await client.conversations.createConversation(conversationParameters);

        // Initialize request and copy over new conversation ID and updated serviceUrl.
        const request = TurnContext.applyConversationReference(
            { type: ActivityTypes.Event, name: ActivityEventNames.CreateConversation },
            reference,
            true
        );

        request.conversation = {
            id: response.id,
            isGroup: conversationParameters.isGroup,
            conversationType: null as any,
            tenantId: reference.conversation!.tenantId,
            name: null as any,
        };

        request.channelData = conversationParameters.channelData;

        if (response.serviceUrl) {
            request.serviceUrl = response.serviceUrl;
        }

        // Create context and run middleware
        const context = this.createContext(request);
        await this.runMiddleware(context, logic);
    }

    /**
     * Asynchronously deletes an existing activity.
     *
     * This interface supports the framework and is not intended to be called directly for your code.
     * Use [TurnContext.deleteActivity](xref:botbuilder-core.TurnContext.deleteActivity) to delete
     * an activity from your bot code.
     *
     * @param context The context object for the turn.
     * @param reference Conversation reference information for the activity to delete.
     *
     * @remarks
     * Not all channels support this operation. For channels that don't, this call may throw an exception.
     */
    async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        if (!reference.serviceUrl) {
            throw new Error('BotFrameworkAdapter.deleteActivity(): missing serviceUrl');
        }
        if (!reference.conversation || !reference.conversation.id) {
            throw new Error('BotFrameworkAdapter.deleteActivity(): missing conversation or conversation.id');
        }
        if (!reference.activityId) {
            throw new Error('BotFrameworkAdapter.deleteActivity(): missing activityId');
        }
        const client: ConnectorClient = this.getOrCreateConnectorClient(
            context,
            reference.serviceUrl,
            this.credentials
        );
        await client.conversations.deleteActivity(reference.conversation.id, reference.activityId);
    }

    /**
     * Asynchronously removes a member from the current conversation.
     *
     * @param context The context object for the turn.
     * @param memberId The ID of the member to remove from the conversation.
     *
     * @remarks
     * Remove a member's identity information from the conversation.
     *
     * Not all channels support this operation. For channels that don't, this call may throw an exception.
     */
    async deleteConversationMember(context: TurnContext, memberId: string): Promise<void> {
        if (!context.activity.serviceUrl) {
            throw new Error('BotFrameworkAdapter.deleteConversationMember(): missing serviceUrl');
        }
        if (!context.activity.conversation || !context.activity.conversation.id) {
            throw new Error('BotFrameworkAdapter.deleteConversationMember(): missing conversation or conversation.id');
        }
        const serviceUrl: string = context.activity.serviceUrl;
        const conversationId: string = context.activity.conversation.id;
        const client: ConnectorClient = this.getOrCreateConnectorClient(context, serviceUrl, this.credentials);
        await client.conversations.deleteConversationMember(conversationId, memberId);
    }

    /**
     * Asynchronously lists the members of a given activity.
     *
     * @param context The context object for the turn.
     * @param activityId Optional. The ID of the activity to get the members of. If not specified, the current activity ID is used.
     *
     * @returns An array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
     * the users involved in a given activity.
     *
     * @remarks
     * Returns an array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
     * the users involved in a given activity.
     *
     * This is different from [getConversationMembers](xref:botbuilder.BotFrameworkAdapter.getConversationMembers)
     * in that it will return only those users directly involved in the activity, not all members of the conversation.
     */
    async getActivityMembers(context: TurnContext, activityId?: string): Promise<ChannelAccount[]> {
        if (!activityId) {
            activityId = context.activity.id;
        }
        if (!context.activity.serviceUrl) {
            throw new Error('BotFrameworkAdapter.getActivityMembers(): missing serviceUrl');
        }
        if (!context.activity.conversation || !context.activity.conversation.id) {
            throw new Error('BotFrameworkAdapter.getActivityMembers(): missing conversation or conversation.id');
        }
        if (!activityId) {
            throw new Error(
                'BotFrameworkAdapter.getActivityMembers(): missing both activityId and context.activity.id'
            );
        }
        const serviceUrl: string = context.activity.serviceUrl;
        const conversationId: string = context.activity.conversation.id;
        const client: ConnectorClient = this.getOrCreateConnectorClient(context, serviceUrl, this.credentials);

        return await client.conversations.getActivityMembers(conversationId, activityId);
    }

    /**
     * Asynchronously lists the members of the current conversation.
     *
     * @param context The context object for the turn.
     *
     * @returns An array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
     * all users currently involved in a conversation.
     *
     * @remarks
     * Returns an array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
     * all users currently involved in a conversation.
     *
     * This is different from [getActivityMembers](xref:botbuilder.BotFrameworkAdapter.getActivityMembers)
     * in that it will return all members of the conversation, not just those directly involved in a specific activity.
     */
    async getConversationMembers(context: TurnContext): Promise<ChannelAccount[]> {
        if (!context.activity.serviceUrl) {
            throw new Error('BotFrameworkAdapter.getConversationMembers(): missing serviceUrl');
        }
        if (!context.activity.conversation || !context.activity.conversation.id) {
            throw new Error('BotFrameworkAdapter.getConversationMembers(): missing conversation or conversation.id');
        }
        const serviceUrl: string = context.activity.serviceUrl;
        const conversationId: string = context.activity.conversation.id;
        const client: ConnectorClient = this.getOrCreateConnectorClient(context, serviceUrl, this.credentials);

        return await client.conversations.getConversationMembers(conversationId);
    }

    /**
     * For the specified channel, asynchronously gets a page of the conversations in which this bot has participated.
     *
     * @param contextOrServiceUrl The URL of the channel server to query or a
     * [TurnContext](xref:botbuilder-core.TurnContext) object from a conversation on the channel.
     * @param continuationToken Optional. The continuation token from the previous page of results.
     * Omit this parameter or use `undefined` to retrieve the first page of results.
     *
     * @returns A [ConversationsResult](xref:botframework-schema.ConversationsResult) object containing a page of results
     * and a continuation token.
     *
     * @remarks
     * The the return value's [conversations](xref:botframework-schema.ConversationsResult.conversations) property contains a page of
     * [ConversationMembers](xref:botframework-schema.ConversationMembers) objects. Each object's
     * [id](xref:botframework-schema.ConversationMembers.id) is the ID of a conversation in which the bot has participated on this channel.
     * This method can be called from outside the context of a conversation, as only the bot's service URL and credentials are required.
     *
     * The channel batches results in pages. If the result's
     * [continuationToken](xref:botframework-schema.ConversationsResult.continuationToken) property is not empty, then
     * there are more pages to get. Use the returned token to get the next page of results.
     * If the `contextOrServiceUrl` parameter is a [TurnContext](xref:botbuilder-core.TurnContext), the URL of the channel server is
     * retrieved from
     * `contextOrServiceUrl`.[activity](xref:botbuilder-core.TurnContext.activity).[serviceUrl](xref:botframework-schema.Activity.serviceUrl).
     */
    async getConversations(
        contextOrServiceUrl: TurnContext | string,
        continuationToken?: string
    ): Promise<ConversationsResult> {
        let client: ConnectorClient;
        if (typeof contextOrServiceUrl === 'object') {
            const context: TurnContext = contextOrServiceUrl as TurnContext;
            client = this.getOrCreateConnectorClient(context, context.activity.serviceUrl, this.credentials);
        } else {
            client = this.createConnectorClient(contextOrServiceUrl as string);
        }

        return await client.conversations.getConversations(
            continuationToken ? { continuationToken: continuationToken } : undefined
        );
    }

    /**
     * Asynchronously attempts to retrieve the token for a user that's in a login flow.
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param magicCode Optional. The validation code the user entered.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     *
     * @returns A [TokenResponse](xref:botframework-schema.TokenResponse) object that contains the user token.
     */
    async getUserToken(context: TurnContext, connectionName: string, magicCode?: string): Promise<TokenResponse>;
    async getUserToken(
        context: TurnContext,
        connectionName: string,
        magicCode?: string,
        oAuthAppCredentials?: CoreAppCredentials
    ): Promise<TokenResponse>;
    /**
     * Asynchronously attempts to retrieve the token for a user that's in a login flow.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param magicCode Optional. The validation code the user entered.
     * @param oAuthAppCredentials Optional. [AppCredentials](xref:botframework-connector.AppCredentials) for OAuth.
     *
     * @returns A [TokenResponse](xref:botframework-schema.TokenResponse) object that contains the user token.
     */
    async getUserToken(
        context: TurnContext,
        connectionName: string,
        magicCode?: string,
        oAuthAppCredentials?: AppCredentials
    ): Promise<TokenResponse|undefined> {
        if (!context.activity.from || !context.activity.from.id) {
            throw new Error('BotFrameworkAdapter.getUserToken(): missing from or from.id');
        }
        if (!connectionName) {
            throw new Error('getUserToken() requires a connectionName but none was provided.');
        }
        this.checkEmulatingOAuthCards(context);
        const userId: string = context.activity.from.id;
        const url: string = this.oauthApiUrl(context);
        const client: TokenApiClient = this.createTokenApiClient(url, oAuthAppCredentials);
        context.turnState.set(this.TokenApiClientCredentialsKey, client);

        const result: TokenApiModels.UserTokenGetTokenResponse = await client.userToken.getToken(
            userId,
            connectionName,
            { code: magicCode, channelId: context.activity.channelId }
        );
        if (!result || !result.token || result._response.status == 404) {
            return undefined;
        } else {
            return result as TokenResponse;
        }
    }

    /**
     * Asynchronously signs out the user from the token server.
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param userId The ID of user to sign out.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     */
    async signOutUser(context: TurnContext, connectionName?: string, userId?: string): Promise<void>;
    async signOutUser(
        context: TurnContext,
        connectionName?: string,
        userId?: string,
        oAuthAppCredentials?: CoreAppCredentials
    ): Promise<void>;
    /**
     * Asynchronously signs out the user from the token server.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for the turn.
     * @param connectionName Optional. The name of the auth connection to use.
     * @param userId Optional. The ID of the user to sign out.
     * @param oAuthAppCredentials Optional. [AppCredentials](xref:botframework-connector.AppCredentials) for OAuth.
     */
    async signOutUser(
        context: TurnContext,
        connectionName?: string,
        userId?: string,
        oAuthAppCredentials?: AppCredentials
    ): Promise<void> {
        if (!context.activity.from || !context.activity.from.id) {
            throw new Error('BotFrameworkAdapter.signOutUser(): missing from or from.id');
        }
        if (!userId) {
            userId = context.activity.from.id;
        }

        this.checkEmulatingOAuthCards(context);
        const url: string = this.oauthApiUrl(context);
        const client: TokenApiClient = this.createTokenApiClient(url, oAuthAppCredentials);
        context.turnState.set(this.TokenApiClientCredentialsKey, client);

        await client.userToken.signOut(userId, {
            connectionName: connectionName,
            channelId: context.activity.channelId,
        });
    }

    /**
     * Asynchronously gets a sign-in link from the token server that can be sent as part
     * of a [SigninCard](xref:botframework-schema.SigninCard).
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     * @param userId The user id that will be associated with the token.
     * @param finalRedirect The final URL that the OAuth flow will redirect to.
     */
    async getSignInLink(
        context: TurnContext,
        connectionName: string,
        oAuthAppCredentials?: AppCredentials,
        userId?: string,
        finalRedirect?: string
    ): Promise<string>;
    async getSignInLink(
        context: TurnContext,
        connectionName: string,
        oAuthAppCredentials?: CoreAppCredentials,
        userId?: string,
        finalRedirect?: string
    ): Promise<string>;
    /**
     * Asynchronously gets a sign-in link from the token server that can be sent as part
     * of a [SigninCard](xref:botframework-schema.SigninCard).
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param oAuthAppCredentials Optional. [AppCredentials](xref:botframework-connector.AppCredentials) for OAuth.
     * @param userId Optional. The user id that will be associated with the token.
     * @param finalRedirect Optional. The final URL that the OAuth flow will redirect to.
     * @returns The sign in link.
     */
    async getSignInLink(
        context: TurnContext,
        connectionName: string,
        oAuthAppCredentials?: AppCredentials,
        userId?: string,
        finalRedirect?: string
    ): Promise<string> {
        if (userId && userId != context.activity.from.id) {
            throw new ReferenceError(
                "cannot retrieve OAuth signin link for a user that's different from the conversation"
            );
        }

        this.checkEmulatingOAuthCards(context);
        const conversation: Partial<ConversationReference> = TurnContext.getConversationReference(context.activity);
        const url: string = this.oauthApiUrl(context);
        const client: TokenApiClient = this.createTokenApiClient(url, oAuthAppCredentials);
        context.turnState.set(this.TokenApiClientCredentialsKey, client);
        const state: any = {
            ConnectionName: connectionName,
            Conversation: conversation,
            MsAppId: (client.credentials as AppCredentials).appId,
            RelatesTo: context.activity.relatesTo,
        };

        const finalState: string = Buffer.from(JSON.stringify(state)).toString('base64');
        return (
            await client.botSignIn.getSignInUrl(finalState, { channelId: context.activity.channelId, finalRedirect })
        )._response.bodyAsText;
    }

    /**
     * Asynchronously retrieves the token status for each configured connection for the given user.
     *
     * @param context The context object for the turn.
     * @param userId Optional. If present, the ID of the user to retrieve the token status for.
     *      Otherwise, the ID of the user who sent the current activity is used.
     * @param includeFilter Optional. A comma-separated list of connection's to include. If present,
     *      the `includeFilter` parameter limits the tokens this method returns.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     *
     * @returns The [TokenStatus](xref:botframework-connector.TokenStatus) objects retrieved.
     */
    async getTokenStatus(context: TurnContext, userId?: string, includeFilter?: string): Promise<TokenStatus[]>;
    async getTokenStatus(
        context: TurnContext,
        userId?: string,
        includeFilter?: string,
        oAuthAppCredentials?: CoreAppCredentials
    ): Promise<TokenStatus[]>;
    /**
     * Asynchronously retrieves the token status for each configured connection for the given user.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for the turn.
     * @param userId Optional. If present, the ID of the user to retrieve the token status for.
     * Otherwise, the ID of the user who sent the current activity is used.
     * @param includeFilter Optional. A comma-separated list of connection's to include. If present,
     * the `includeFilter` parameter limits the tokens this method returns.
     * @param oAuthAppCredentials Optional. [AppCredentials](xref:botframework-connector.AppCredentials) for OAuth.
     *
     * @returns The [TokenStatus](xref:botframework-connector.TokenStatus) objects retrieved.
     */
    async getTokenStatus(
        context: TurnContext,
        userId?: string,
        includeFilter?: string,
        oAuthAppCredentials?: AppCredentials
    ): Promise<TokenStatus[]> {
        if (!userId && (!context.activity.from || !context.activity.from.id)) {
            throw new Error('BotFrameworkAdapter.getTokenStatus(): missing from or from.id');
        }
        this.checkEmulatingOAuthCards(context);
        userId = userId || context.activity.from.id;
        const url: string = this.oauthApiUrl(context);
        const client: TokenApiClient = this.createTokenApiClient(url, oAuthAppCredentials);
        context.turnState.set(this.TokenApiClientCredentialsKey, client);

        return (
            await client.userToken.getTokenStatus(userId, {
                channelId: context.activity.channelId,
                include: includeFilter,
            })
        )._response.parsedBody;
    }

    /**
     * Asynchronously signs out the user from the token server.
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param resourceUrls The list of resource URLs to retrieve tokens for.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     *
     * @returns A map of the [TokenResponse](xref:botframework-schema.TokenResponse) objects by resource URL.
     */
    async getAadTokens(
        context: TurnContext,
        connectionName: string,
        resourceUrls: string[]
    ): Promise<{ [propertyName: string]: TokenResponse }>;
    async getAadTokens(
        context: TurnContext,
        connectionName: string,
        resourceUrls: string[],
        oAuthAppCredentials?: CoreAppCredentials
    ): Promise<{ [propertyName: string]: TokenResponse }>;
    /**
     * Asynchronously signs out the user from the token server.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param resourceUrls The list of resource URLs to retrieve tokens for.
     * @param oAuthAppCredentials Optional. [AppCredentials](xref:botframework-connector.AppCredentials) for OAuth.
     *
     * @returns A map of the [TokenResponse](xref:botframework-schema.TokenResponse) objects by resource URL.
     */
    async getAadTokens(
        context: TurnContext,
        connectionName: string,
        resourceUrls: string[],
        oAuthAppCredentials?: AppCredentials
    ): Promise<{ [propertyName: string]: TokenResponse }> {
        if (!context.activity.from || !context.activity.from.id) {
            throw new Error('BotFrameworkAdapter.getAadTokens(): missing from or from.id');
        }
        this.checkEmulatingOAuthCards(context);
        const userId: string = context.activity.from.id;
        const url: string = this.oauthApiUrl(context);
        const client: TokenApiClient = this.createTokenApiClient(url, oAuthAppCredentials);
        context.turnState.set(this.TokenApiClientCredentialsKey, client);

        return (
            await client.userToken.getAadTokens(
                userId,
                connectionName,
                { resourceUrls: resourceUrls },
                { channelId: context.activity.channelId }
            )
        )._response.parsedBody as { [propertyName: string]: TokenResponse };
    }

    /**
     * Asynchronously Get the raw signin resource to be sent to the user for signin.
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param userId The user id that will be associated with the token.
     * @param finalRedirect The final URL that the OAuth flow will redirect to.
     * @param appCredentials Optional. The CoreAppCredentials for OAuth.
     * @returns The [BotSignInGetSignInResourceResponse](xref:botframework-connector.BotSignInGetSignInResourceResponse) object.
     */
    async getSignInResource(
        context: TurnContext,
        connectionName: string,
        userId?: string,
        finalRedirect?: string,
        appCredentials?: CoreAppCredentials
    ): Promise<SignInUrlResponse> {
        if (!connectionName) {
            throw new Error('getUserToken() requires a connectionName but none was provided.');
        }

        if (!context.activity.from || !context.activity.from.id) {
            throw new Error('BotFrameworkAdapter.getSignInResource(): missing from or from.id');
        }

        // The provided userId doesn't match the from.id on the activity. (same for finalRedirect)
        if (userId && context.activity.from.id !== userId) {
            throw new Error(
                'BotFrameworkAdapter.getSiginInResource(): cannot get signin resource for a user that is different from the conversation'
            );
        }

        const url: string = this.oauthApiUrl(context);
        const credentials = appCredentials as AppCredentials;
        const client: TokenApiClient = this.createTokenApiClient(url, credentials);
        const conversation: Partial<ConversationReference> = TurnContext.getConversationReference(context.activity);

        const state: any = {
            ConnectionName: connectionName,
            Conversation: conversation,
            relatesTo: context.activity.relatesTo,
            MSAppId: (client.credentials as AppCredentials).appId,
        };
        const finalState: string = Buffer.from(JSON.stringify(state)).toString('base64');
        const options: TokenApiModels.BotSignInGetSignInResourceOptionalParams = { finalRedirect: finalRedirect };

        return await client.botSignIn.getSignInResource(finalState, options);
    }

    /**
     * Asynchronously Performs a token exchange operation such as for single sign-on.
     *
     * @param context Context for the current turn of conversation with the user.
     * @param connectionName Name of the auth connection to use.
     * @param userId The user id that will be associated with the token.
     * @param tokenExchangeRequest The exchange request details, either a token to exchange or a uri to exchange.
     * @param appCredentials Optional. The CoreAppCredentials for OAuth.
     */
    async exchangeToken(
        context: TurnContext,
        connectionName: string,
        userId: string,
        tokenExchangeRequest: TokenExchangeRequest,
        appCredentials?: CoreAppCredentials
    ): Promise<TokenResponse>;
    /**
     * Asynchronously Performs a token exchange operation such as for single sign-on.
     *
     * @param context The [TurnContext](xref:botbuilder-core.TurnContext) for the turn.
     * @param connectionName Name of the auth connection to use.
     * @param userId The user id that will be associated with the token.
     * @param tokenExchangeRequest The [TokenExchangeRequest](xref:botbuilder-schema.TokenExchangeRequest), either a token to exchange or a uri to exchange.
     * @param appCredentials Optional. [AppCredentials](xref:botframework-connector.AppCredentials) for OAuth.
     * @returns A `Promise` representing the exchanged [TokenResponse](xref:botframework-schema.TokenResponse).
     */
    async exchangeToken(
        context: TurnContext,
        connectionName: string,
        userId: string,
        tokenExchangeRequest: TokenExchangeRequest,
        appCredentials?: AppCredentials
    ): Promise<TokenResponse> {
        if (!connectionName) {
            throw new Error('exchangeToken() requires a connectionName but none was provided.');
        }

        if (!userId) {
            throw new Error('exchangeToken() requires an userId but none was provided.');
        }

        if (tokenExchangeRequest && !tokenExchangeRequest.token && !tokenExchangeRequest.uri) {
            throw new Error(
                'BotFrameworkAdapter.exchangeToken(): Either a Token or Uri property is required on the TokenExchangeRequest'
            );
        }

        const url: string = this.oauthApiUrl(context);
        const client: TokenApiClient = this.createTokenApiClient(url, appCredentials);

        return (
            await client.userToken.exchangeAsync(
                userId,
                connectionName,
                context.activity.channelId,
                tokenExchangeRequest
            )
        )._response.parsedBody as TokenResponse;
    }

    /**
     * Asynchronously sends an emulated OAuth card for a channel.
     *
     * This method supports the framework and is not intended to be called directly for your code.
     *
     * @param contextOrServiceUrl The URL of the emulator.
     * @param emulate `true` to send an emulated OAuth card to the emulator; or `false` to not send the card.
     *
     * @remarks
     * When testing a bot in the Bot Framework Emulator, this method can emulate the OAuth card interaction.
     */
    async emulateOAuthCards(contextOrServiceUrl: TurnContext | string, emulate: boolean): Promise<void> {
        this.isEmulatingOAuthCards = emulate;
        const url: string = this.oauthApiUrl(contextOrServiceUrl);
        await EmulatorApiClient.emulateOAuthCards(this.credentials, url, emulate);
    }

    /**
     * Asynchronously creates a turn context and runs the middleware pipeline for an incoming activity.
     *
     * @param req An Express or Restify style request object.
     * @param res An Express or Restify style response object.
     * @param logic The function to call at the end of the middleware pipeline.
     *
     * @remarks
     * This is the main way a bot receives incoming messages and defines a turn in the conversation. This method:
     *
     * 1. Parses and authenticates an incoming request.
     *    - The activity is read from the body of the incoming request. An error will be returned
     *      if the activity can't be parsed.
     *    - The identity of the sender is authenticated as either the Emulator or a valid Microsoft
     *      server, using the bot's `appId` and `appPassword`. The request is rejected if the sender's
     *      identity is not verified.
     * 1. Creates a [TurnContext](xref:botbuilder-core.TurnContext) object for the received activity.
     *    - This object is wrapped with a [revocable proxy](https://www.ecma-international.org/ecma-262/6.0/#sec-proxy.revocable).
     *    - When this method completes, the proxy is revoked.
     * 1. Sends the turn context through the adapter's middleware pipeline.
     * 1. Sends the turn context to the `logic` function.
     *    - The bot may perform additional routing or processing at this time.
     *      Returning a promise (or providing an `async` handler) will cause the adapter to wait for any asynchronous operations to complete.
     *    - After the `logic` function completes, the promise chain set up by the middleware is resolved.
     *
     * > [!TIP]
     * > If you see the error `TypeError: Cannot perform 'set' on a proxy that has been revoked`
     * > in your bot's console output, the likely cause is that an async function was used
     * > without using the `await` keyword. Make sure all async functions use await!
     *
     * Middleware can _short circuit_ a turn. When this happens, subsequent middleware and the
     * `logic` function is not called; however, all middleware prior to this point still run to completion.
     * For more information about the middleware pipeline, see the
     * [how bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
     * [middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware) articles.
     * Use the adapter's [use](xref:botbuilder-core.BotAdapter.use) method to add middleware to the adapter.
     *
     * For example:
     * ```JavaScript
     * server.post('/api/messages', (req, res) => {
     *    // Route received request to adapter for processing
     *    adapter.processActivity(req, res, async (context) => {
     *        // Process any messages received
     *        if (context.activity.type === ActivityTypes.Message) {
     *            await context.sendActivity(`Hello World`);
     *        }
     *    });
     * });
     * ```
     */
    async processActivity(
        req: WebRequest,
        res: WebResponse,
        logic: (context: TurnContext) => Promise<any>
    ): Promise<void> {
        let body: any;
        let status: number = 400;
        let processError: Error|undefined;
        try {
            // Parse body of request
            status = 400;
            const request = await parseRequest(req);

            // Authenticate the incoming request
            status = 401;
            const authHeader: string = req.headers.authorization || req.headers.Authorization || '';

            const identity = await this.authenticateRequestInternal(request, authHeader);

            // Set the correct callerId value and discard values received over the wire
            request.callerId = await this.generateCallerId(identity) as string;

            // Process received activity
            status = 500;
            const context: TurnContext = this.createContext(request);
            context.turnState.set(this.BotIdentityKey, identity);
            const connectorClient = await this.createConnectorClientWithIdentity(request.serviceUrl, identity);
            context.turnState.set(this.ConnectorClientKey, connectorClient);

            const oAuthScope: string = SkillValidation.isSkillClaim(identity.claims)
                ? JwtTokenValidation.getAppIdFromClaims(identity.claims)
                : this.credentials.oAuthScope;
            context.turnState.set(this.OAuthScopeKey, oAuthScope);

            context.turnState.set(BotCallbackHandlerKey, logic);
            await this.runMiddleware(context, logic);

            // NOTE: The factoring of the code differs here when compared to C# as processActivity() returns Promise<void>.
            //       This is due to the fact that the response to the incoming activity is sent from inside this implementation.
            //       In C#, ProcessActivityAsync() returns Task<InvokeResponse> and ASP.NET handles sending of the response.
            if (request.deliveryMode === DeliveryModes.ExpectReplies) {
                // Handle "expectReplies" scenarios where all the activities have been buffered and sent back at once
                // in an invoke response.
                let activities = context.bufferedReplyActivities;

                // If the channel is not the emulator, do not send trace activities.
                // Fixes: https://github.com/microsoft/botbuilder-js/issues/2732
                if (request.channelId !== Channels.Emulator) {
                    activities = activities.filter((a) => a.type !== ActivityTypes.Trace);
                }

                body = { activities } as ExpectedReplies;
                status = StatusCodes.OK;
            } else if (request.type === ActivityTypes.Invoke) {
                // Retrieve a cached Invoke response to handle Invoke scenarios.
                // These scenarios deviate from the request/request model as the Bot should return a specific body and status.
                const invokeResponse: any = context.turnState.get(INVOKE_RESPONSE_KEY);
                if (invokeResponse && invokeResponse.value) {
                    const value: InvokeResponse = invokeResponse.value;
                    status = value.status;
                    body = value.body;
                } else {
                    status = StatusCodes.NOT_IMPLEMENTED;
                }
            } else {
                status = StatusCodes.OK;
            }
        } catch (err: unknown) {
            // Catch the error to try and throw the stacktrace out of processActivity()
            processError = err as Error;
            body = (err as Error).toString();
        }

        // Return status
        res.status(status);
        if (body) {
            res.send(body);
        }
        res.end();

        // Check for an error
        if (status >= 400) {
            if (processError && (processError as Error).stack) {
                throw new Error(`BotFrameworkAdapter.processActivity(): ${status} ERROR\n ${processError.stack}`);
            } else {
                throw new Error(`BotFrameworkAdapter.processActivity(): ${status} ERROR`);
            }
        }
    }

    /**
     * Asynchronously creates a turn context and runs the middleware pipeline for an incoming activity.
     *
     * @param activity The activity to process.
     * @param logic The function to call at the end of the middleware pipeline.
     *
     * @remarks
     * This is the main way a bot receives incoming messages and defines a turn in the conversation. This method:
     *
     * 1. Creates a [TurnContext](xref:botbuilder-core.TurnContext) object for the received activity.
     *    - This object is wrapped with a [revocable proxy](https://www.ecma-international.org/ecma-262/6.0/#sec-proxy.revocable).
     *    - When this method completes, the proxy is revoked.
     * 1. Sends the turn context through the adapter's middleware pipeline.
     * 1. Sends the turn context to the `logic` function.
     *    - The bot may perform additional routing or processing at this time.
     *      Returning a promise (or providing an `async` handler) will cause the adapter to wait for any asynchronous operations to complete.
     *    - After the `logic` function completes, the promise chain set up by the middleware is resolved.
     *
     * Middleware can _short circuit_ a turn. When this happens, subsequent middleware and the
     * `logic` function is not called; however, all middleware prior to this point still run to completion.
     * For more information about the middleware pipeline, see the
     * [how bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
     * [middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware) articles.
     * Use the adapter's [use](xref:botbuilder-core.BotAdapter.use) method to add middleware to the adapter.
     */
    async processActivityDirect(activity: Activity, logic: (context: TurnContext) => Promise<any>): Promise<void> {
        let processError: Error|undefined;
        try {
            // Process activity
            const context: TurnContext = this.createContext(activity);
            context.turnState.set(BotCallbackHandlerKey, logic);
            await this.runMiddleware(context, logic);
        } catch (err: unknown) {
            // Catch the error to try and throw the stacktrace out of processActivity()
            processError = err as Error;
        }

        if (processError) {
            if (processError && (processError as Error).stack) {
                throw new Error(`BotFrameworkAdapter.processActivityDirect(): ERROR\n ${processError.stack}`);
            } else {
                throw new Error('BotFrameworkAdapter.processActivityDirect(): ERROR');
            }
        }
    }

    /**
     * Asynchronously sends a set of outgoing activities to a channel server.
     *
     * This method supports the framework and is not intended to be called directly for your code.
     * Use the turn context's [sendActivity](xref:botbuilder-core.TurnContext.sendActivity) or
     * [sendActivities](xref:botbuilder-core.TurnContext.sendActivities) method from your bot code.
     *
     * @param context The context object for the turn.
     * @param activities The activities to send.
     *
     * @returns An array of [ResourceResponse](xref:)
     *
     * @remarks
     * The activities will be sent one after another in the order in which they're received. A
     * response object will be returned for each sent activity. For `message` activities this will
     * contain the ID of the delivered message.
     */
    async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses: ResourceResponse[] = [];
        for (let i = 0; i < activities.length; i++) {
            const activity: Partial<Activity> = activities[i];
            switch (activity.type) {
                case 'delay':
                    await delay(typeof activity.value === 'number' ? activity.value : 1000);
                    responses.push({} as ResourceResponse);
                    break;
                case ActivityTypes.InvokeResponse:
                    // Cache response to context object. This will be retrieved when turn completes.
                    context.turnState.set(INVOKE_RESPONSE_KEY, activity);
                    responses.push({} as ResourceResponse);
                    break;
                default: {
                    if (!activity.serviceUrl) {
                        throw new Error('BotFrameworkAdapter.sendActivity(): missing serviceUrl.');
                    }
                    if (!activity.conversation || !activity.conversation.id) {
                        throw new Error('BotFrameworkAdapter.sendActivity(): missing conversation id.');
                    }
                    if (activity && BotFrameworkAdapter.isStreamingServiceUrl(activity.serviceUrl)) {
                        if (!this.isStreamingConnectionOpen) {
                            throw new Error(
                                'BotFrameworkAdapter.sendActivities(): Unable to send activity as Streaming connection is closed.'
                            );
                        }
                        TokenResolver.checkForOAuthCards(this, context, activity as Activity);
                    }
                    const client = this.getOrCreateConnectorClient(context, activity.serviceUrl, this.credentials);
                    if (activity.type === ActivityTypes.Trace && activity.channelId !== Channels.Emulator) {
                        // Just eat activity
                        responses.push({} as ResourceResponse);
                    } else if (activity.replyToId) {
                        responses.push(
                            await client.conversations.replyToActivity(
                                activity.conversation.id,
                                activity.replyToId,
                                activity
                            )
                        );
                    } else {
                        responses.push(
                            await client.conversations.sendToConversation(activity.conversation.id, activity)
                        );
                    }
                    break;
                }
            }
        }
        return responses;
    }

    /**
     * Asynchronously replaces a previous activity with an updated version.
     *
     * This interface supports the framework and is not intended to be called directly for your code.
     * Use [TurnContext.updateActivity](xref:botbuilder-core.TurnContext.updateActivity) to update
     * an activity from your bot code.
     *
     * @param context The context object for the turn.
     * @param activity The updated version of the activity to replace.
     * @returns A `Promise` representing the [ResourceResponse](xref:botframework-schema.ResourceResponse) for the operation.
     * @remarks
     * Not all channels support this operation. For channels that don't, this call may throw an exception.
     */
    async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<ResourceResponse | void> {
        if (!activity.serviceUrl) {
            throw new Error('BotFrameworkAdapter.updateActivity(): missing serviceUrl');
        }
        if (!activity.conversation || !activity.conversation.id) {
            throw new Error('BotFrameworkAdapter.updateActivity(): missing conversation or conversation.id');
        }
        if (!activity.id) {
            throw new Error('BotFrameworkAdapter.updateActivity(): missing activity.id');
        }

        const client = this.getOrCreateConnectorClient(context, activity.serviceUrl, this.credentials);
        return client.conversations.updateActivity(activity.conversation.id, activity.id, activity);
    }

    /**
     * Creates a connector client.
     *
     * @param serviceUrl The client's service URL.
     * @returns The [ConnectorClient](xref:botbuilder-connector.ConnectorClient) instance.
     * @remarks
     * Override this in a derived class to create a mock connector client for unit testing.
     */
    createConnectorClient(serviceUrl: string): ConnectorClient {
        return this.createConnectorClientInternal(serviceUrl, this.credentials);
    }

    /**
     * Create a ConnectorClient with a ClaimsIdentity.
     *
     * @remarks
     * If the ClaimsIdentity contains the claims for a Skills request, create a ConnectorClient for use with Skills.
     * Derives the correct audience from the ClaimsIdentity, or the instance's credentials property.
     * @param serviceUrl The client's service URL.
     * @param identity ClaimsIdentity
     */
    async createConnectorClientWithIdentity(serviceUrl: string, identity: ClaimsIdentity): Promise<ConnectorClient>;
    /**
     * Create a ConnectorClient with a ClaimsIdentity and an explicit audience.
     *
     * @remarks
     * If the trimmed audience is not a non-zero length string, the audience will be derived from the ClaimsIdentity or
     * the instance's credentials property.
     * @param serviceUrl The client's service URL.
     * @param identity ClaimsIdentity
     * @param audience The recipient of the ConnectorClient's messages. Normally the Bot Framework Channel Service or the AppId of another bot.
     */
    async createConnectorClientWithIdentity(
        serviceUrl: string,
        identity: ClaimsIdentity,
        audience: string
    ): Promise<ConnectorClient>;
    /**
     * Create a [ConnectorClient](xref:botbuilder-connector.ConnectorClient) with a [ClaimsIdentity](xref:botbuilder-connector.ClaimsIdentity).
     *
     * @remarks
     * If the [ClaimsIdentity](xref:botbuilder-connector.ClaimsIdentity) contains the claims for a Skills request, create a [ConnectorClient](xref:botbuilder-connector.ConnectorClient) for use with Skills.
     * Derives the correct audience from the [ClaimsIdentity](xref:botbuilder-connector.ClaimsIdentity), or the instance's credentials property.
     * @param serviceUrl The client's service URL.
     * @param identity [ClaimsIdentity](xref:botbuilder-connector.ClaimsIdentity).
     * @param audience Optional. The recipient of the [ConnectorClient](xref:botbuilder-connector.ConnectorClient)'s messages. Normally the Bot Framework Channel Service or the AppId of another bot.
     * @returns The client.
     */
    async createConnectorClientWithIdentity(
        serviceUrl: string,
        identity: ClaimsIdentity,
        audience?: string
    ): Promise<ConnectorClient> {
        if (!identity) {
            throw new Error('BotFrameworkAdapter.createConnectorClientWithIdentity(): invalid identity parameter.');
        }

        const botAppId =
            identity.getClaimValue(AuthenticationConstants.AudienceClaim) ||
            identity.getClaimValue(AuthenticationConstants.AppIdClaim);
        // Check if the audience is a string and when trimmed doesn't have a length of 0.
        const validAudience = typeof audience === 'string' && audience.trim().length > 0;
        const oAuthScope = validAudience ? audience : await this.getOAuthScope(botAppId!, identity.claims);
        const credentials = await this.buildCredentials(botAppId!, oAuthScope);

        const client: ConnectorClient = this.createConnectorClientInternal(serviceUrl, credentials);
        return client;
    }

    private createConnectorClientInternal(serviceUrl: string, credentials: AppCredentials): ConnectorClient {
        if (BotFrameworkAdapter.isStreamingServiceUrl(serviceUrl)) {
            // Check if we have a streaming server. Otherwise, requesting a connector client
            // for a non-existent streaming connection results in an error
            if (!this.streamingServer) {
                throw new Error(
                    `Cannot create streaming connector client for serviceUrl ${serviceUrl} without a streaming connection. Call 'useWebSocket' or 'useNamedPipe' to start a streaming connection.`
                );
            }

            const clientOptions = this.getClientOptions(serviceUrl, new StreamingHttpClient(this.streamingServer));
            return new ConnectorClient(credentials, clientOptions);
        }

        const clientOptions = this.getClientOptions(serviceUrl);
        return new ConnectorClient(credentials, clientOptions);
    }

    private getClientOptions(serviceUrl: string, httpClient?: HttpClient): ConnectorClientOptions {
        const { requestPolicyFactories, ...clientOptions } = this.settings.clientOptions ?? {};

        const options: ConnectorClientOptions = Object.assign({}, { baseUri: serviceUrl }, clientOptions);

        if (httpClient) {
            options.httpClient = httpClient;
        }

        const userAgent = typeof options.userAgent === 'function' ? options.userAgent(USER_AGENT) : options.userAgent;
        const setUserAgent = userAgentPolicy({
            value: `${USER_AGENT}${userAgent ?? ''}`,
        });

        const acceptHeader: RequestPolicyFactory = {
            create: (nextPolicy) => ({
                sendRequest: (httpRequest) => {
                    if (!httpRequest.headers.contains('accept')) {
                        httpRequest.headers.set('accept', '*/*');
                    }
                    return nextPolicy.sendRequest(httpRequest);
                },
            }),
        };

        // Resolve any user request policy factories, then include our user agent via a factory policy
        options.requestPolicyFactories = (defaultRequestPolicyFactories) => {
            let defaultFactories: any[] = [];

            if (requestPolicyFactories) {
                if (typeof requestPolicyFactories === 'function') {
                    const newDefaultFactories = requestPolicyFactories(defaultRequestPolicyFactories);
                    if (newDefaultFactories) {
                        defaultFactories = newDefaultFactories;
                    }
                } else if (requestPolicyFactories) {
                    defaultFactories = [...requestPolicyFactories];
                }

                // If the user has supplied custom factories, allow them to optionally set user agent
                // before we do.
                defaultFactories = [...defaultFactories, acceptHeader, setUserAgent];
            } else {
                // In the case that there are no user supplied factories, inject our user agent as
                // the first policy to ensure none of the default policies override it.
                defaultFactories = [acceptHeader, setUserAgent, ...defaultRequestPolicyFactories];
            }

            return defaultFactories;
        };

        return options;
    }

    // Retrieves the ConnectorClient from the TurnContext or creates a new ConnectorClient with the provided serviceUrl and credentials.
    private getOrCreateConnectorClient(
        context: TurnContext,
        serviceUrl: string,
        credentials: AppCredentials
    ): ConnectorClient {
        if (!context || !context.turnState) throw new Error('invalid context parameter');
        if (!serviceUrl) throw new Error('invalid serviceUrl');
        if (!credentials) throw new Error('invalid credentials');

        let client: ConnectorClient = context.turnState.get(this.ConnectorClientKey);
        // Inspect the retrieved client to confirm that the serviceUrl is correct, if it isn't, create a new one.
        if (!client || client['baseUri'] !== serviceUrl) {
            client = this.createConnectorClientInternal(serviceUrl, credentials);
        }

        return client;
    }

    /**
     * Returns the correct [OAuthScope](xref:botframework-connector.AppCredentials.OAuthScope) for [AppCredentials](xref:botframework-connector.AppCredentials).
     *
     * @param botAppId The bot's AppId.
     * @param claims The [Claim](xref:botbuilder-connector.Claim) list to check.
     *
     * @returns The current credentials' OAuthScope.
     */
    private async getOAuthScope(botAppId: string, claims: Claim[]): Promise<string> {
        // If the Claims are for skills, we need to create an AppCredentials instance with
        // the correct scope for communication between the caller and the skill.
        if (botAppId && SkillValidation.isSkillClaim(claims)) {
            return JwtTokenValidation.getAppIdFromClaims(claims);
        }

        // Return the current credentials' OAuthScope.
        return this.credentials.oAuthScope;
    }

    /**
     *
     * @remarks
     * When building credentials for bot-to-bot communication, oAuthScope must be passed in.
     * @param appId The application id.
     * @param oAuthScope The optional OAuth scope.
     * @returns The app credentials to be used to acquire tokens.
     */
    protected async buildCredentials(appId: string, oAuthScope?: string): Promise<AppCredentials> {
        // There is no cache for AppCredentials in JS as opposed to C#.
        // Instead of retrieving an AppCredentials from the Adapter instance, generate a new one
        const appPassword = await this.credentialsProvider.getAppPassword(appId);

        let credentials: AppCredentials;
        if (this.settings.certificateThumbprint && this.settings.certificatePrivateKey) {
            credentials = new CertificateAppCredentials(
                appId,
                this.settings.certificateThumbprint,
                this.settings.certificatePrivateKey,
                this.settings.channelAuthTenant
            );
        } else {
            credentials = new MicrosoftAppCredentials(appId, appPassword!, this.settings.channelAuthTenant, oAuthScope);
        }

        if (JwtTokenValidation.isGovernment(this.settings.channelService!)) {
            credentials.oAuthEndpoint = GovernmentConstants.ToChannelFromBotLoginUrl;
            credentials.oAuthScope = oAuthScope || GovernmentConstants.ToChannelFromBotOAuthScope;
        }

        return credentials;
    }

    /**
     * Creates an OAuth API client.
     *
     * @param serviceUrl The client's service URL.
     * @param oAuthAppCredentials AppCredentials for OAuth.
     *
     * @remarks
     * Override this in a derived class to create a mock OAuth API client for unit testing.
     */
    protected createTokenApiClient(serviceUrl: string, oAuthAppCredentials?: CoreAppCredentials): TokenApiClient;
    /**
     * Creates an OAuth API client.
     *
     * @param serviceUrl The client's service URL.
     * @param oAuthAppCredentials Optional. The [AppCredentials](xref:botframework-connector.AppCredentials)for OAuth.
     *
     * @remarks
     * Override this in a derived class to create a mock OAuth API client for unit testing.
     * @returns The client.
     */
    protected createTokenApiClient(serviceUrl: string, oAuthAppCredentials?: AppCredentials): TokenApiClient {
        const tokenApiClientCredentials = oAuthAppCredentials ? oAuthAppCredentials : this.credentials;
        const client = new TokenApiClient(tokenApiClientCredentials, { baseUri: serviceUrl, userAgent: USER_AGENT });

        return client;
    }

    /**
     * Allows for the overriding of authentication in unit tests.
     *
     * @param request Received request.
     * @param authHeader Received authentication header.
     */
    protected async authenticateRequest(request: Partial<Activity>, authHeader: string): Promise<void> {
        const identity = await this.authenticateRequestInternal(request, authHeader);
        if (!identity.isAuthenticated) {
            throw new Error('Unauthorized Access. Request is not authorized');
        }

        // Set the correct callerId value and discard values received over the wire
        request.callerId = await this.generateCallerId(identity);
    }

    /**
     * @ignore
     * @private
     * Returns the actual ClaimsIdentity from the JwtTokenValidation.authenticateRequest() call.
     * @remarks
     * This method is used instead of authenticateRequest() in processActivity() to obtain the ClaimsIdentity for caching in the TurnContext.turnState.
     *
     * @param request Received request.
     * @param authHeader Received authentication header.
     */
    private authenticateRequestInternal(request: Partial<Activity>, authHeader: string): Promise<ClaimsIdentity> {
        return JwtTokenValidation.authenticateRequest(
            request,
            authHeader,
            this.credentialsProvider,
            this.settings.channelService!,
            this.authConfiguration
        );
    }

    /**
     * Generates the CallerId property for the activity based on
     * https://github.com/microsoft/botframework-obi/blob/main/protocols/botframework-activity/botframework-activity.md#appendix-v---caller-id-values.
     *
     * @param identity The inbound claims.
     * @returns {Promise<string>} a promise representing the generated callerId.
     */
    private async generateCallerId(identity: ClaimsIdentity): Promise<string|undefined> {
        if (!identity) {
            throw new TypeError('BotFrameworkAdapter.generateCallerId(): Missing identity parameter.');
        }

        // Is the bot accepting all incoming messages?
        const isAuthDisabled = await this.credentialsProvider.isAuthenticationDisabled();
        if (isAuthDisabled) {
            // Return undefined so that the callerId is cleared.
            return;
        }

        // Is the activity from another bot?
        if (SkillValidation.isSkillClaim(identity.claims)) {
            const callerId = JwtTokenValidation.getAppIdFromClaims(identity.claims);
            return `${CallerIdConstants.BotToBotPrefix}${callerId}`;
        }

        // Is the activity from Public Azure?
        if (!this.settings.channelService || this.settings.channelService.length === 0) {
            return CallerIdConstants.PublicAzureChannel;
        }

        // Is the activity from Azure Gov?
        if (JwtTokenValidation.isGovernment(this.settings.channelService)) {
            return CallerIdConstants.USGovChannel;
        }

        // Return undefined so that the callerId is cleared.
    }

    /**
     * Gets the OAuth API endpoint.
     *
     * @param contextOrServiceUrl The URL of the channel server to query or
     * a [TurnContext](xref:botbuilder-core.TurnContext). For a turn context, the context's
     * [activity](xref:botbuilder-core.TurnContext.activity).[serviceUrl](xref:botframework-schema.Activity.serviceUrl)
     * is used for the URL.
     * @returns The endpoint used for the API requests.
     * @remarks
     * Override this in a derived class to create a mock OAuth API endpoint for unit testing.
     */
    protected oauthApiUrl(contextOrServiceUrl: TurnContext | string): string {
        return this.isEmulatingOAuthCards
            ? typeof contextOrServiceUrl === 'object'
                ? contextOrServiceUrl.activity.serviceUrl
                : contextOrServiceUrl
            : this.settings.oAuthEndpoint
            ? this.settings.oAuthEndpoint
            : JwtTokenValidation.isGovernment(this.settings.channelService!)
            ? US_GOV_OAUTH_ENDPOINT
            : OAUTH_ENDPOINT;
    }

    /**
     * Checks the environment and can set a flag to emulate OAuth cards.
     *
     * @param context The context object for the turn.
     *
     * @remarks
     * Override this in a derived class to control how OAuth cards are emulated for unit testing.
     */
    protected checkEmulatingOAuthCards(context: TurnContext): void {
        if (!this.isEmulatingOAuthCards && context.activity.channelId === 'emulator' && !this.credentials.appId) {
            this.isEmulatingOAuthCards = true;
        }
    }

    /**
     * Creates a turn context.
     *
     * @param request An incoming request body.
     * @returns A new [TurnContext](xref:botbuilder-core.TurnContext) instance.
     * @remarks
     * Override this in a derived class to modify how the adapter creates a turn context.
     */
    protected createContext(request: Partial<Activity>): TurnContext {
        return new TurnContext(this, request);
    }

    /**
     * Checks the validity of the request and attempts to map it the correct virtual endpoint,
     * then generates and returns a response if appropriate.
     *
     * @param request A ReceiveRequest from the connected channel.
     * @returns A response created by the BotAdapter to be sent to the client that originated the request.
     */
    async processRequest(request: IReceiveRequest): Promise<StreamingResponse> {
        const response = new StreamingResponse();

        if (!request) {
            response.statusCode = StatusCodes.BAD_REQUEST;
            response.setBody('No request provided.');
            return response;
        }

        if (!request.verb || !request.path) {
            response.statusCode = StatusCodes.BAD_REQUEST;
            response.setBody(`Request missing verb and/or path. Verb: ${request.verb}. Path: ${request.path}`);
            return response;
        }

        if (request.verb.toLocaleUpperCase() !== POST && request.verb.toLocaleUpperCase() !== GET) {
            response.statusCode = StatusCodes.METHOD_NOT_ALLOWED;
            response.setBody(`Invalid verb received. Only GET and POST are accepted. Verb: ${request.verb}`);
        }

        if (request.path.toLocaleLowerCase() === VERSION_PATH) {
            return await this.handleVersionRequest(request, response);
        }

        // Convert the StreamingRequest into an activity the Adapter can understand.
        let body: Activity;
        try {
            body = await this.readRequestBodyAsString(request);
        } catch (error) {
            response.statusCode = StatusCodes.BAD_REQUEST;
            response.setBody(`Request body missing or malformed: ${error}`);
            return response;
        }

        if (request.path.toLocaleLowerCase() !== MESSAGES_PATH) {
            response.statusCode = StatusCodes.NOT_FOUND;
            response.setBody(`Path ${request.path.toLocaleLowerCase()} not not found. Expected ${MESSAGES_PATH}}.`);
            return response;
        }

        if (request.verb.toLocaleUpperCase() !== POST) {
            response.statusCode = StatusCodes.METHOD_NOT_ALLOWED;
            response.setBody(
                `Invalid verb received for ${request.verb.toLocaleLowerCase()}. Only GET and POST are accepted. Verb: ${
                    request.verb
                }`
            );

            return response;
        }

        try {
            const context = new TurnContext(this, body);
            await this.runMiddleware(context, this.logic);

            if (body.type === ActivityTypes.Invoke) {
                const invokeResponse: any = context.turnState.get(INVOKE_RESPONSE_KEY);
                if (invokeResponse && invokeResponse.value) {
                    const value: InvokeResponse = invokeResponse.value;
                    response.statusCode = value.status;
                    if (value.body) {
                        response.setBody(value.body);
                    }
                } else {
                    response.statusCode = StatusCodes.NOT_IMPLEMENTED;
                }
            } else if (body.deliveryMode === DeliveryModes.ExpectReplies) {
                const replies: ExpectedReplies = { activities: context.bufferedReplyActivities as Activity[] };
                response.setBody(replies);
                response.statusCode = StatusCodes.OK;
            } else {
                response.statusCode = StatusCodes.OK;
            }
        } catch (error) {
            response.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
            response.setBody(error);
            return response;
        }

        return response;
    }

    /**
     * Process a web request by applying a logic function.
     *
     * @param req An incoming HTTP [Request](xref:botbuilder.Request)
     * @param res The corresponding HTTP [Response](xref:botbuilder.Response)
     * @param logic The logic function to apply
     * @returns a promise representing the asynchronous operation.
     */
    async process(req: Request, res: Response, logic: (context: TurnContext) => Promise<void>): Promise<void>;

    /**
     * Handle a web socket connection by applying a logic function to
     * each streaming request.
     *
     * @param req An incoming HTTP [Request](xref:botbuilder.Request)
     * @param socket The corresponding [INodeSocket](xref:botframework-streaming.INodeSocket)
     * @param head The corresponding [INodeBuffer](xref:botframework-streaming.INodeBuffer)
     * @param logic The logic function to apply
     * @returns a promise representing the asynchronous operation.
     */
    async process(
        req: Request,
        socket: INodeSocket,
        head: INodeBuffer,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;

    /**
     * @internal
     */
    async process(
        req: Request,
        resOrSocket: Response | INodeSocket,
        logicOrHead: ((context: TurnContext) => Promise<void>) | INodeBuffer,
        maybeLogic?: (context: TurnContext) => Promise<void>
    ): Promise<void> {
        if (maybeLogic) {
            return this.useWebSocket(
                req,
                INodeSocketT.parse(resOrSocket),
                INodeBufferT.parse(logicOrHead),
                LogicT.parse(maybeLogic)
            );
        } else {
            return this.processActivity(req, ResponseT.parse(resOrSocket), LogicT.parse(logicOrHead));
        }
    }

    /**
     * Connects the handler to a Named Pipe server and begins listening for incoming requests.
     *
     * @param logic The logic that will handle incoming requests.
     * @param pipeName The name of the named pipe to use when creating the server.
     * @param retryCount Number of times to attempt to bind incoming and outgoing pipe
     * @param onListen Optional callback that fires once when server is listening on both incoming and outgoing pipe
     */
    async useNamedPipe(
        logic: (context: TurnContext) => Promise<any>,
        pipeName = defaultPipeName,
        retryCount = 7,
        onListen?: () => void
    ): Promise<void> {
        if (!logic) {
            throw new Error('Bot logic needs to be provided to `useNamedPipe`');
        }

        if (this.isStreamingConnectionOpen) {
            if (this.namedPipeName === pipeName) {
                // Idempotent operation
                return;
            } else {
                // BotFrameworkAdapters are scoped to one streaming connection.
                // Switching streams is an advanced scenario, one not innately supported by the SDK.
                // Each BotFrameworkAdapter instance is scoped to a stream, so switching streams
                // results in dropped conversations that the bot cannot reconnect to.
                throw new Error(
                    'This BotFrameworkAdapter instance is already connected to a different stream. Use a new instance to connect to the provided pipeName.'
                );
            }
        }

        this.logic = logic;

        await retry(() => this.startNamedPipeServer(pipeName, onListen), retryCount);
    }

    /**
     * Process the initial request to establish a long lived connection via a streaming server.
     *
     * @param req The connection request.
     * @param socket The raw socket connection between the bot (server) and channel/caller (client).
     * @param head The first packet of the upgraded stream.
     * @param logic The logic that handles incoming streaming requests for the lifetime of the WebSocket connection.
     */
    async useWebSocket(
        req: WebRequest,
        socket: INodeSocket,
        head: INodeBuffer,
        logic: (context: TurnContext) => Promise<any>
    ): Promise<void> {
        // Use the provided NodeWebSocketFactoryBase on BotFrameworkAdapter construction,
        // otherwise create a new NodeWebSocketFactory.
        const webSocketFactory = this.webSocketFactory || new NodeWebSocketFactory();

        if (!logic) {
            throw new Error('Streaming logic needs to be provided to `useWebSocket`');
        }

        this.logic = logic;

        try {
            await this.authenticateConnection(req, this.settings.channelService);
        } catch (err: unknown) {
            abortWebSocketUpgrade(socket, err);
            throw err;
        }

        const nodeWebSocket = await webSocketFactory.createWebSocket(req, socket, head);

        await this.startWebSocket(nodeWebSocket);
    }

    private async startNamedPipeServer(pipeName: string, onListen?: () => void): Promise<void> {
        this.namedPipeName = pipeName;
        this.streamingServer = new NamedPipeServer(pipeName, this);

        try {
            await this.streamingServer.start(onListen);
        } finally {
            this.namedPipeName = undefined;
        }
    }

    private async authenticateConnection(req: WebRequest, channelService?: string): Promise<void> {
        if (!this.credentials.appId) {
            // auth is disabled
            return;
        }

        const authHeader: string = req.headers.authorization || req.headers.Authorization || '';
        const channelIdHeader: string = req.headers.channelid || req.headers.ChannelId || req.headers.ChannelID || '';
        // Validate the received Upgrade request from the channel.
        const claims = await JwtTokenValidation.validateAuthHeader(
            authHeader,
            this.credentialsProvider,
            channelService!,
            channelIdHeader
        );

        if (!claims.isAuthenticated) {
            throw new AuthenticationError('Unauthorized Access. Request is not authorized', StatusCodes.UNAUTHORIZED);
        }
    }

    /**
     * Connects the handler to a WebSocket server and begins listening for incoming requests.
     *
     * @param socket The socket to use when creating the server.
     */
    private async startWebSocket(socket: ISocket): Promise<void> {
        this.streamingServer = new WebSocketServer(socket, this);
        await this.streamingServer.start();
    }

    private async readRequestBodyAsString(request: IReceiveRequest): Promise<Activity> {
        const [activityStream, ...attachmentStreams] = request.streams;

        const activity = await activityStream.readAsJson<Activity>();

        activity.attachments = await Promise.all(
            attachmentStreams.map(async (attachmentStream) => {
                const contentType = attachmentStream.contentType;

                const content =
                    contentType === 'application/json'
                        ? await attachmentStream.readAsJson()
                        : await attachmentStream.readAsString();

                return { contentType, content };
            })
        );

        return activity;
    }

    private async handleVersionRequest(
        request: IReceiveRequest,
        response: StreamingResponse
    ): Promise<StreamingResponse> {
        if (request.verb!.toLocaleUpperCase() === GET) {
            response.statusCode = StatusCodes.OK;

            if (!this.credentials.appId) {
                response.setBody({ UserAgent: USER_AGENT });
                return response;
            }

            let token = '';
            try {
                token = await this.credentials.getToken();
            } catch (err: unknown) {
                /**
                 * In reality a missing BotToken will cause the channel to close the connection,
                 * but we still send the response and allow the channel to make that decision
                 * instead of proactively disconnecting. This allows the channel to know why
                 * the connection has been closed and make the choice not to make endless reconnection
                 * attempts that will end up right back here.
                 */
                console.error((err as Error).message);
            }
            response.setBody({ UserAgent: USER_AGENT, BotToken: token });
        } else {
            response.statusCode = StatusCodes.METHOD_NOT_ALLOWED;
            response.setBody(
                `Invalid verb received for path: ${request.path}. Only GET is accepted. Verb: ${request.verb}`
            );
        }

        return response;
    }

    /**
     * Determine if the serviceUrl was sent via an Http/Https connection or Streaming
     * This can be determined by looking at the ServiceUrl property:
     *   (1) All channels that send messages via http/https are not streaming
     *   (2) Channels that send messages via streaming have a ServiceUrl that does not begin with http/https.
     *
     * @param serviceUrl the serviceUrl provided in the resquest.
     * @returns True if the serviceUrl is a streaming url, otherwise false.
     */
    private static isStreamingServiceUrl(serviceUrl: string): boolean {
        return serviceUrl != undefined && !serviceUrl.toLowerCase().startsWith('http');
    }
}

/**
 * Handles incoming webhooks from the botframework
 * @private
 * @param req incoming web request
 */
function parseRequest(req: WebRequest): Promise<Activity> {
    return new Promise((resolve: any, reject: any): void => {
        if (req.body) {
            try {
                const activity = validateAndFixActivity(req.body);
                resolve(activity);
            } catch (err: unknown) {
                reject(err);
            }
        } else {
            let requestData = '';
            req.on!('data', (chunk: string): void => {
                requestData += chunk;
            });
            req.on!('end', (): void => {
                try {
                    req.body = JSON.parse(requestData);
                    const activity = validateAndFixActivity(req.body);
                    resolve(activity);
                } catch (err: unknown) {
                    reject(err);
                }
            });
        }
    });
}

/**
 * Creates an error message with status code to write to socket, then closes the connection.
 *
 * @param socket The raw socket connection between the bot (server) and channel/caller (client).
 * @param err The error. If the error includes a status code, it will be included in the message written to the socket.
 */
function abortWebSocketUpgrade(socket: INodeSocket, err: any): void {
    if (socket.writable) {
        const connectionHeader = "Connection: 'close'\r\n";

        let message = '';
        AuthenticationError.isStatusCodeError(err)
            ? (message = `HTTP/1.1 ${err.statusCode} ${StatusCodes[err.statusCode]}\r\n${
                  err.message
              }\r\n${connectionHeader}\r\n`)
            : (message = AuthenticationError.determineStatusCodeAndBuildMessage(err));

        socket.write(message);
    }
    socket.destroy();
}
