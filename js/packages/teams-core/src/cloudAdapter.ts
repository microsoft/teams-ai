// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';
import type { BotFrameworkHttpAdapter } from './botFrameworkHttpAdapter';
import { Activity, InvokeResponse, StatusCodes } from '@microsoft/teams-connector/src/schema';
import { GET, POST, VERSION_PATH } from './streaming';
import { HttpClient, HttpHeaders, HttpOperationResponse, WebResource } from '@azure/ms-rest-js';
import { INodeBufferT, INodeSocketT, LogicT } from './zod';
import { Request, Response, ResponseT } from './interfaces';
import { USER_AGENT } from './botFrameworkAdapter';
import { retry } from './internals';
import { validateAndFixActivity } from './activityValidator';

import {
    AuthenticateRequestResult,
    AuthenticationError,
    BotFrameworkAuthentication,
    BotFrameworkAuthenticationFactory,
    ClaimsIdentity,
    ConnectorClient,
    ConnectorFactory,
    MicrosoftAppCredentials,
} from '@microsoft/teams-connector';

import {
    INodeBuffer,
    INodeSocket,
    IReceiveRequest,
    IReceiveResponse,
    IStreamingTransportServer,
    NamedPipeServer,
    NodeWebSocketFactory,
    RequestHandler,
    StreamingRequest,
    StreamingResponse,
    WebSocketServer,
} from 'botframework-streaming';
import { CloudAdapterBase } from './cloudAdapterBase';
import { TurnContext } from './turnContext';

// Note: this is _okay_ because we pass the result through `validateAndFixActivity`. Should not be used otherwise.
const ActivityT = z.custom<Activity>((val) => z.record(z.unknown()).check(val), { message: 'Activity' });

/**
 * An adapter that implements the Bot Framework Protocol and can be hosted in different cloud environmens both public and private.
 */
export class CloudAdapter extends CloudAdapterBase implements BotFrameworkHttpAdapter {
    /**
     * Initializes a new instance of the [CloudAdapter](xref:botbuilder:CloudAdapter) class.
     *
     * @param botFrameworkAuthentication Optional [BotFrameworkAuthentication](xref:botframework-connector.BotFrameworkAuthentication) instance
     */
    constructor(botFrameworkAuthentication: BotFrameworkAuthentication = BotFrameworkAuthenticationFactory.create()) {
        super(botFrameworkAuthentication);
    }

    /**
     * Process a web request by applying a logic function.
     *
     * @param req An incoming HTTP [Request](xref:botbuilder.Request)
     * @param req The corresponding HTTP [Response](xref:botbuilder.Response)
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
        // Early return with web socket handler if function invocation matches that signature
        if (maybeLogic) {
            const socket = INodeSocketT.parse(resOrSocket);
            const head = INodeBufferT.parse(logicOrHead);
            const logic = LogicT.parse(maybeLogic);

            return this.connect(req, socket, head, logic);
        }

        const res = ResponseT.parse(resOrSocket);

        const logic = LogicT.parse(logicOrHead);

        const end = (status: StatusCodes, body?: unknown) => {
            res.status(status);
            if (body) {
                res.send(body);
            }
            res.end();
        };

        // Only POST requests from here on out
        if (req.method !== 'POST') {
            return end(StatusCodes.METHOD_NOT_ALLOWED);
        }

        // Ensure we have a parsed request body already. We rely on express/restify middleware to parse
        // request body and azure functions, which does it for us before invoking our code. Warn the user
        // to update their code and return an error.
        if (!z.record(z.unknown()).check(req.body)) {
            return end(
                StatusCodes.BAD_REQUEST,
                '`req.body` not an object, make sure you are using middleware to parse incoming requests.'
            );
        }

        const activity = validateAndFixActivity(ActivityT.parse(req.body));

        if (!activity.type) {
            console.warn('BadRequest: Missing activity or activity type.');
            return end(StatusCodes.BAD_REQUEST);
        }

        const authHeader = z.string().parse(req.headers.Authorization ?? req.headers.authorization ?? '');

        try {
            const invokeResponse = await this.processActivity(authHeader, activity, logic);
            return end(invokeResponse?.status ?? StatusCodes.OK, invokeResponse?.body);
        } catch (err: unknown) {
            return end(
                err instanceof AuthenticationError ? StatusCodes.UNAUTHORIZED : StatusCodes.INTERNAL_SERVER_ERROR,
                (err as Error).message ?? err
            );
        }
    }

    /**
     * Used to connect the adapter to a named pipe.
     *
     * @param pipeName Pipe name to connect to (note: yields two named pipe servers by appending ".incoming" and ".outgoing" to this name)
     * @param logic The logic function to call for resulting bot turns.
     * @param appId The Bot application ID
     * @param audience The audience to use for outbound communication. The will vary by cloud environment.
     * @param callerId Optional, the caller ID
     * @param retryCount Optional, the number of times to retry a failed connection (defaults to 7)
     */
    async connectNamedPipe(
        pipeName: string,
        logic: (context: TurnContext) => Promise<void>,
        appId: string,
        audience: string,
        callerId?: string,
        retryCount = 7
    ): Promise<void> {
        z.object({
            pipeName: z.string(),
            logic: LogicT,
            appId: z.string(),
            audience: z.string(),
            callerId: z.string().optional(),
        }).parse({ pipeName, logic, appId, audience, callerId });

        // The named pipe is local and so there is no network authentication to perform: so we can create the result here.
        const authenticateRequestResult: AuthenticateRequestResult = {
            audience,
            callerId,
            claimsIdentity: appId ? this.createClaimsIdentity(appId) : new ClaimsIdentity([]),
        };

        // Creat request handler
        const requestHandler = new StreamingRequestHandler(
            authenticateRequestResult,
            (authenticateRequestResult, activity) => this.processActivity(authenticateRequestResult, activity, logic)
        );

        // Create server
        const server = new NamedPipeServer(pipeName, requestHandler);

        // Attach server to request handler for outbound requests
        requestHandler.server = server;

        // Spin it up
        await retry(() => server.start(), retryCount);
    }

    private async connect(
        req: Request,
        socket: INodeSocket,
        head: INodeBuffer,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void> {
        // Grab the auth header from the inbound http request
        const authHeader = z.string().parse(req.headers.Authorization ?? req.headers.authorization ?? '');

        // Grab the channelId which should be in the http headers
        const channelIdHeader = z.string().optional().parse(req.headers.channelid);

        // Authenticate inbound request
        const authenticateRequestResult = await this.botFrameworkAuthentication.authenticateStreamingRequest(
            authHeader,
            channelIdHeader!
        );

        // Creat request handler
        const requestHandler = new StreamingRequestHandler(
            authenticateRequestResult,
            (authenticateRequestResult, activity) => this.processActivity(authenticateRequestResult, activity, logic)
        );

        // Create server
        const server = new WebSocketServer(
            await new NodeWebSocketFactory().createWebSocket(req, socket, head),
            requestHandler
        );

        // Attach server to request handler
        requestHandler.server = server;

        // Spin it up
        await server.start();
    }
}

/**
 * @internal
 */
class StreamingRequestHandler extends RequestHandler {
    server?: IStreamingTransportServer;

    // Note: `processActivity` lambda is to work around the fact that CloudAdapterBase#processActivity
    // is protected, and we can't get around that by defining classes inside of other classes
    constructor(
        private readonly authenticateRequestResult: AuthenticateRequestResult,
        private readonly processActivity: (
            authenticateRequestResult: AuthenticateRequestResult,
            activity: Activity
        ) => Promise<InvokeResponse | undefined>
    ) {
        super();

        // Attach streaming connector factory to authenticateRequestResult so it's used for outbound calls
        this.authenticateRequestResult.connectorFactory = new StreamingConnectorFactory(this);
    }

    async processRequest(request: IReceiveRequest): Promise<StreamingResponse> {
        const response = new StreamingResponse();

        const end = (statusCode: StatusCodes, body?: unknown): StreamingResponse => {
            response.statusCode = statusCode;
            if (body) {
                response.setBody(body);
            }
            return response;
        };

        if (!request) {
            return end(StatusCodes.BAD_REQUEST, 'No request provided.');
        }

        if (!request.verb || !request.path) {
            return end(
                StatusCodes.BAD_REQUEST,
                `Request missing verb and/or path. Verb: ${request.verb}, Path: ${request.path}`
            );
        }

        if (request.verb.toUpperCase() !== POST && request.verb.toUpperCase() !== GET) {
            return end(
                StatusCodes.METHOD_NOT_ALLOWED,
                `Invalid verb received. Only GET and POST are accepted. Verb: ${request.verb}`
            );
        }

        if (request.path.toLowerCase() === VERSION_PATH) {
            if (request.verb.toUpperCase() === GET) {
                return end(StatusCodes.OK, { UserAgent: USER_AGENT });
            } else {
                return end(
                    StatusCodes.METHOD_NOT_ALLOWED,
                    `Invalid verb received for path: ${request.path}. Only GET is accepted. Verb: ${request.verb}`
                );
            }
        }

        const [activityStream, ...attachmentStreams] = request.streams;

        let activity: Activity;
        try {
            activity = validateAndFixActivity(ActivityT.parse(await activityStream.readAsJson()));

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
        } catch (err: unknown) {
            return end(StatusCodes.BAD_REQUEST, `Request body missing or malformed: ${err}`);
        }

        try {
            const invokeResponse = await this.processActivity(this.authenticateRequestResult, activity);
            return end(invokeResponse?.status ?? StatusCodes.OK, invokeResponse?.body);
        } catch (err: unknown) {
            return end(StatusCodes.INTERNAL_SERVER_ERROR, (err as Error).message ?? err);
        }
    }
}

/**
 * @internal
 */
class StreamingConnectorFactory implements ConnectorFactory {
    private serviceUrl?: string;

    constructor(private readonly requestHandler: StreamingRequestHandler) {}

    async create(serviceUrl: string, _audience: string): Promise<ConnectorClient> {
        this.serviceUrl ??= serviceUrl;

        if (serviceUrl !== this.serviceUrl) {
            throw new Error(
                'This is a streaming scenario, all connectors from this factory must all be for the same url.'
            );
        }

        const httpClient = new StreamingHttpClient(this.requestHandler);

        return new ConnectorClient(MicrosoftAppCredentials.Empty, { httpClient });
    }
}

/**
 * @internal
 */
class StreamingHttpClient implements HttpClient {
    constructor(private readonly requestHandler: StreamingRequestHandler) {}

    async sendRequest(httpRequest: WebResource): Promise<HttpOperationResponse> {
        const streamingRequest = this.createStreamingRequest(httpRequest);
        const receiveResponse = await this.requestHandler.server?.send(streamingRequest);
        return this.createHttpResponse(receiveResponse!, httpRequest);
    }

    private createStreamingRequest(httpRequest: WebResource): StreamingRequest {
        const verb = httpRequest.method.toString();
        const path = httpRequest.url.slice(httpRequest.url.indexOf('/v3'));

        const request = StreamingRequest.create(verb, path);
        request.setBody(httpRequest.body);

        return request;
    }

    private async createHttpResponse(
        receiveResponse: IReceiveResponse,
        httpRequest: WebResource
    ): Promise<HttpOperationResponse> {
        const [bodyAsText] =
            (await Promise.all(receiveResponse.streams?.map((stream) => stream.readAsString()) ?? [])) ?? [];

        return {
            bodyAsText,
            headers: new HttpHeaders(),
            request: httpRequest,
            status: receiveResponse.statusCode!,
        };
    }
}
