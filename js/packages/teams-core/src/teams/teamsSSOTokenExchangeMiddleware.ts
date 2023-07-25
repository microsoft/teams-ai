// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';

import {
    ActivityTypes,
    Channels,
    StatusCodes,
    TokenExchangeInvokeRequest,
    TokenExchangeInvokeResponse,
    TokenResponse,
} from '@microsoft/teams-connector/src/schema';
import { TurnContext } from '../turnContext';
import { ExtendedUserTokenProvider } from '../extendedUserTokenProvider';
import { Middleware } from '../middlewareSet';
import { tokenExchangeOperationName } from '../signInConstants';
import { StoreItem } from '../storage';

function getStorageKey(context: TurnContext): string {
    const activity = context.activity;

    const channelId = activity.channelId;
    if (!channelId) {
        throw new Error('invalid activity. Missing channelId');
    }

    const conversationId = activity.conversation?.id;
    if (!conversationId) {
        throw new Error('invalid activity. Missing conversation.id');
    }

    const value = activity.value;
    if (!value?.id) {
        throw new Error('Invalid signin/tokenExchange. Missing activity.value.id.');
    }

    return `${channelId}/${conversationId}/${value.id}`;
}

async function sendInvokeResponse(context: TurnContext, body: unknown = null, status = StatusCodes.OK): Promise<void> {
    await context.sendActivity({
        type: ActivityTypes.InvokeResponse,
        value: { body, status },
    });
}

const ExchangeToken = z.custom<Pick<ExtendedUserTokenProvider, 'exchangeToken'>>(
    (val: any) => typeof val.exchangeToken === 'function',
    { message: 'ExtendedUserTokenProvider' }
);

/**
 * If the activity name is signin/tokenExchange, this middleware will attempt to
 * exchange the token, and deduplicate the incoming call, ensuring only one
 * exchange request is processed.
 *
 * If a user is signed into multiple Teams clients, the Bot could receive a
 * "signin/tokenExchange" from each client. Each token exchange request for a
 * specific user login will have an identical activity.value.id.
 *
 * Only one of these token exchange requests should be processed by the bot.
 * The others return [StatusCodes.PRECONDITION_FAILED](xref:botframework-schema:StatusCodes.PRECONDITION_FAILED).
 * For a distributed bot in production, this requires distributed storage
 * ensuring only one token exchange is processed. This middleware supports
 * CosmosDb storage found in botbuilder-azure, or MemoryStorage for local development.
 */
export class TeamsSSOTokenExchangeMiddleware implements Middleware {
    /**
     * Initializes a new instance of the TeamsSSOTokenExchangeMiddleware class.
     *
     * @param storage The [Storage](xref:botbuilder-core.Storage) to use for deduplication
     * @param oAuthConnectionName The connection name to use for the single sign on token exchange
     */
    constructor(private readonly storage: Storage, private readonly oAuthConnectionName: string) {
        if (!storage) {
            throw new TypeError('`storage` parameter is required');
        }

        if (!oAuthConnectionName) {
            throw new TypeError('`oAuthConnectionName` parameter is required');
        }
    }

    /**
     * Called each time the bot receives a new request.
     *
     * @param context Context for current turn of conversation with the user.
     * @param next Function to call to continue execution to the next step in the middleware chain.
     */
    async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        if (context.activity.channelId === Channels.Msteams && context.activity.name === tokenExchangeOperationName) {
            // If the TokenExchange is NOT successful, the response will have already been sent by exchangedToken
            if (!(await this.exchangedToken(context))) {
                return;
            }

            // Only one token exchange should proceed from here. Deduplication is performed second because in the case
            // of failure due to consent required, every caller needs to receive a response
            if (!(await this.deduplicatedTokenExchangeId(context))) {
                // If the token is not exchangeable, do not process this activity further.
                return;
            }
        }

        await next();
    }

    private async deduplicatedTokenExchangeId(context: TurnContext): Promise<boolean> {
        // Create a StoreItem with Etag of the unique 'signin/tokenExchange' request
        const storeItem: StoreItem = {
            eTag: context.activity.value?.id,
        };

        try {
            // Writing the IStoreItem with ETag of unique id will succeed only once
            await this.storage.write({
                [getStorageKey(context)]: storeItem,
            });
        } catch (err: unknown) {
            const message = (err as Error).message?.toLowerCase();

            // Do NOT proceed processing this message, some other thread or machine already has processed it.
            // Send 200 invoke response.
            if (message.includes('etag conflict') || message.includes('precondition is not met')) {
                await sendInvokeResponse(context);
                return false;
            }

            throw err;
        }

        return true;
    }

    private async exchangedToken(context: TurnContext): Promise<boolean> {
        let tokenExchangeResponse: TokenResponse|undefined;
        const tokenExchangeRequest: TokenExchangeInvokeRequest = context.activity.value;

        const tokenProvider = ExchangeToken.parse(context.adapter);

        // TODO(jgummersall) convert to new user token client provider when available
        try {
            tokenExchangeResponse = await tokenProvider.exchangeToken(
                context,
                this.oAuthConnectionName,
                context.activity.channelId,
                { token: tokenExchangeRequest.token }
            );
        } catch (_err) {
            // Ignore Exceptions
            // If token exchange failed for any reason, tokenExchangeResponse above stays null,
            // and hence we send back a failure invoke response to the caller.
        }

        if (!tokenExchangeResponse?.token) {
            // The token could not be exchanged (which could be due to a consent requirement)
            // Notify the sender that PreconditionFailed so they can respond accordingly.

            const invokeResponse: TokenExchangeInvokeResponse = {
                id: tokenExchangeRequest.id,
                connectionName: this.oAuthConnectionName,
                failureDetail: 'The bot is unable to exchange token. Proceed with regular login.',
            };

            await sendInvokeResponse(context, invokeResponse, StatusCodes.PRECONDITION_FAILED);

            return false;
        }

        return true;
    }
}
