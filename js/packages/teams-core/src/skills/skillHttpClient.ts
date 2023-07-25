/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    Activity,
    ConversationReference,
    InvokeResponse,
} from '@microsoft/teams-connector/src/schema';
import {
    ICredentialProvider,
    JwtTokenValidation,
    GovernmentConstants,
    AuthenticationConstants,
} from '@microsoft/teams-connector';
import { BotFrameworkHttpClient } from '../botFrameworkHttpClient';
import { SkillConversationIdFactoryBase } from './skillConversationIdFactoryBase';
import { BotFrameworkSkill } from './botFrameworkSkill';
import { SkillConversationIdFactoryOptions } from './skillConversationIdFactoryOptions';
import { TurnContext } from '../turnContext';

/**
 * A BotFrameworkHttpClient specialized for Skills that encapsulates Conversation ID generation.
 */
export class SkillHttpClient extends BotFrameworkHttpClient {
    private readonly conversationIdFactory: SkillConversationIdFactoryBase;

    /**
     * Creates a new instance of the [SkillHttpClient](xref:botbuilder-core.SkillHttpClient) class.
     *
     * @param credentialProvider An instance of [ICredentialProvider](xref:botframework-connector.ICredentialProvider).
     * @param conversationIdFactory An instance of a class derived from [SkillConversationIdFactoryBase](xref:botbuilder-core.SkillConversationIdFactoryBase).
     * @param channelService Optional. The channel service.
     */
    constructor(
        credentialProvider: ICredentialProvider,
        conversationIdFactory: SkillConversationIdFactoryBase,
        channelService?: string
    ) {
        super(credentialProvider, channelService);
        if (!conversationIdFactory) {
            throw new Error('conversationIdFactory missing');
        }

        this.conversationIdFactory = conversationIdFactory;
    }

    /**
     * Uses the SkillConversationIdFactory to create or retrieve a Skill Conversation Id, and sends the activity.
     *
     * @template T The type of body in the InvokeResponse.
     * @param originatingAudience The OAuth audience scope, used during token retrieval. (Either https://api.botframework.com or bot app id.)
     * @param fromBotId The MicrosoftAppId of the bot sending the activity.
     * @param toSkill The skill to create the Conversation Id for.
     * @param callbackUrl The callback Url for the skill host.
     * @param activity The activity to send.
     */
    async postToSkill<T>(
        originatingAudience: string,
        fromBotId: string,
        toSkill: BotFrameworkSkill,
        callbackUrl: string,
        activity: Activity
    ): Promise<InvokeResponse<T>>;
    /**
     * Uses the SkillConversationIdFactory to create or retrieve a Skill Conversation Id, and sends the activity.
     *
     * @deprecated This overload is deprecated. Please use SkillHttpClient.postToSkill() that takes an `originatingAudience`.
     * @param fromBotId The MicrosoftAppId of the bot sending the activity.
     * @param toSkill The skill to create the Conversation Id for.
     * @param callbackUrl The callback Url for the skill host.
     * @param activity The activity to send.
     */
    async postToSkill(
        fromBotId: string,
        toSkill: BotFrameworkSkill,
        callbackUrl: string,
        activity: Activity
    ): Promise<InvokeResponse>;
    /**
     * Uses the `SkillConversationIdFactory` to create or retrieve a Skill Conversation Id, and sends the [Activity](xref:botframework-schema.Activity).
     *
     * @param audienceOrFromBotId The OAuth audience scope, used during token retrieval or the AppId of the bot sending the [Activity](xref:botframework-schema.Activity).
     * @param fromBotIdOrSkill The AppId of the bot sending the [Activity](xref:botframework-schema.Activity) or the skill to create the Conversation Id for.
     * @param toSkillOrCallbackUrl The skill to create the Conversation Id for or the callback Url for the skill host.
     * @param callbackUrlOrActivity The callback Url for the skill host or the [Activity](xref:botframework-schema.Activity) to send.
     * @param activityToForward Optional. The [Activity](xref:botframework-schema.Activity) to forward.
     * @returns A `Promise` representing the [InvokeResponse](xref:botbuilder-core.InvokeResponse) for the operation.
     */
    async postToSkill<T = any>(
        audienceOrFromBotId: string,
        fromBotIdOrSkill: string | BotFrameworkSkill,
        toSkillOrCallbackUrl: BotFrameworkSkill | string,
        callbackUrlOrActivity: string | Activity,
        activityToForward?: Activity
    ): Promise<InvokeResponse<T>> {
        let originatingAudience: string;
        let fromBotId: string;
        if (typeof fromBotIdOrSkill === 'string') {
            fromBotId = fromBotIdOrSkill;
            // If fromBotIdOrSkill is a string, then audienceOrFromBotId should be a string per the overload.
            originatingAudience = audienceOrFromBotId;
        } else {
            fromBotId = audienceOrFromBotId as string;
            originatingAudience = JwtTokenValidation.isGovernment(this.channelService)
                ? GovernmentConstants.ToChannelFromBotOAuthScope
                : AuthenticationConstants.ToChannelFromBotOAuthScope;
        }

        const toSkill =
            typeof toSkillOrCallbackUrl === 'object' ? toSkillOrCallbackUrl : (fromBotIdOrSkill as BotFrameworkSkill);
        const callbackUrl =
            typeof callbackUrlOrActivity === 'string' ? callbackUrlOrActivity : (toSkillOrCallbackUrl as string);
        const activity =
            typeof activityToForward === 'object' ? activityToForward : (callbackUrlOrActivity as Activity);
        let skillConversationId: string;
        try {
            const createIdOptions: SkillConversationIdFactoryOptions = {
                activity,
                botFrameworkSkill: toSkill,
                fromBotId: fromBotId,
                fromBotOAuthScope: originatingAudience,
            };

            skillConversationId = await this.conversationIdFactory.createSkillConversationIdWithOptions(
                createIdOptions
            );
        } catch (err: unknown) {
            if ((err as Error).message === 'Not Implemented') {
                skillConversationId = await this.conversationIdFactory.createSkillConversationId(
                    TurnContext.getConversationReference(activity) as ConversationReference
                );
            } else {
                throw err;
            }
        }

        return await this.postActivity<T>(
            fromBotId,
            toSkill.appId,
            toSkill.skillEndpoint,
            callbackUrl,
            skillConversationId,
            activity
        );
    }
}
