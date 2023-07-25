/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AppBasedLinkQuery,
    ChannelInfo,
    Channels,
    FileConsentCardResponse,
    InvokeResponse,
    MeetingStartEventDetails,
    MeetingEndEventDetails,
    MessagingExtensionAction,
    MessagingExtensionActionResponse,
    MessagingExtensionQuery,
    MessagingExtensionResponse,
    O365ConnectorCardActionQuery,
    SigninStateVerificationQuery,
    TabRequest,
    TabResponse,
    TabSubmit,
    TaskModuleRequest,
    TaskModuleResponse,
    TeamsChannelData,
    TeamsChannelAccount,
    TeamInfo,
} from '@microsoft/teams-connector/src/schema';
import { ReadReceiptInfo } from '@microsoft/teams-connector';
import { TeamsInfo } from './teamsInfo';
import * as z from 'zod';
import { ActivityHandler } from './activityHandler';
import { TurnContext } from './turnContext';
import { tokenExchangeOperationName, verifyStateOperationName } from './signInConstants';

const TeamsMeetingStartT = z
    .object({
        Id: z.string(),
        JoinUrl: z.string(),
        MeetingType: z.string(),
        Title: z.string(),
        StartTime: z.string(),
    })
    .nonstrict();

const TeamsMeetingEndT = z
    .object({
        Id: z.string(),
        JoinUrl: z.string(),
        MeetingType: z.string(),
        Title: z.string(),
        EndTime: z.string(),
    })
    .nonstrict();

/**
 * Adds support for Microsoft Teams specific events and interactions.
 *
 * @remarks
 * Developers may handle Conversation Update activities sent from Microsoft Teams via two methods:
 *  1. Overriding methods starting with `on..` and *not* ending in `..Event()` (e.g. `onTeamsMembersAdded()`), or instead
 *  2. Passing callbacks to methods starting with `on..` *and* ending in `...Event()` (e.g. `onTeamsMembersAddedEvent()`),
 *      to stay in line with older {@see ActivityHandler} implementation.
 *
 * Developers should use either #1 or #2, above for all Conversation Update activities and not *both* #2 and #3 for the same activity. Meaning,
 *   developers should override `onTeamsMembersAdded()` and not use both `onTeamsMembersAdded()` and `onTeamsMembersAddedEvent()`.
 *
 * Developers wanting to handle Invoke activities *must* override methods starting with `handle...()` (e.g. `handleTeamsTaskModuleFetch()`).
 */
export class TeamsActivityHandler extends ActivityHandler {
    /**
     * Invoked when an invoke activity is received from the connector.
     * Invoke activities can be used to communicate many different things.
     *
     * @param context A context object for this turn.
     * @returns An Invoke Response for the activity.
     */
    protected async onInvokeActivity(context: TurnContext): Promise<InvokeResponse> {
        let runEvents = true;
        try {
            if (!context.activity.name && context.activity.channelId === 'msteams') {
                return await this.handleTeamsCardActionInvoke(context);
            } else {
                switch (context.activity.name) {
                    case 'fileConsent/invoke':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsFileConsent(context, context.activity.value)
                        );

                    case 'actionableMessage/executeAction':
                        await this.handleTeamsO365ConnectorCardAction(context, context.activity.value);
                        return ActivityHandler.createInvokeResponse();

                    case 'composeExtension/queryLink':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsAppBasedLinkQuery(context, context.activity.value)
                        );

                    case 'composeExtension/anonymousQueryLink':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsAnonymousAppBasedLinkQuery(context, context.activity.value)
                        );

                    case 'composeExtension/query':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsMessagingExtensionQuery(context, context.activity.value)
                        );

                    case 'composeExtension/selectItem':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsMessagingExtensionSelectItem(context, context.activity.value)
                        );

                    case 'composeExtension/submitAction':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsMessagingExtensionSubmitActionDispatch(
                                context,
                                context.activity.value
                            )
                        );

                    case 'composeExtension/fetchTask':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsMessagingExtensionFetchTask(context, context.activity.value)
                        );

                    case 'composeExtension/querySettingUrl':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsMessagingExtensionConfigurationQuerySettingUrl(
                                context,
                                context.activity.value
                            )
                        );

                    case 'composeExtension/setting':
                        await this.handleTeamsMessagingExtensionConfigurationSetting(context, context.activity.value);
                        return ActivityHandler.createInvokeResponse();

                    case 'composeExtension/onCardButtonClicked':
                        await this.handleTeamsMessagingExtensionCardButtonClicked(context, context.activity.value);
                        return ActivityHandler.createInvokeResponse();

                    case 'task/fetch':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsTaskModuleFetch(context, context.activity.value)
                        );

                    case 'task/submit':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsTaskModuleSubmit(context, context.activity.value)
                        );

                    case 'tab/fetch':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsTabFetch(context, context.activity.value)
                        );

                    case 'tab/submit':
                        return ActivityHandler.createInvokeResponse(
                            await this.handleTeamsTabSubmit(context, context.activity.value)
                        );

                    default:
                        runEvents = false;
                        return super.onInvokeActivity(context);
                }
            }
        } catch (err: unknown) {
            if ((err as Error).message === 'NotImplemented') {
                return { status: 501 };
            } else if ((err as Error).message === 'BadRequest') {
                return { status: 400 };
            }
            throw err;
        } finally {
            if (runEvents) {
                this.defaultNextEvent(context)();
            }
        }
    }

    /**
     * Handles a Teams Card Action Invoke activity.
     *
     * @param _context A context object for this turn.
     * @returns An Invoke Response for the activity.
     */
    protected async handleTeamsCardActionInvoke(_context: TurnContext): Promise<InvokeResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'fileConsent/invoke'. Handlers registered here run before
     * `handleTeamsFileConsentAccept` and `handleTeamsFileConsentDecline`.
     * Developers are not passed a pointer to the next `handleTeamsFileConsent` handler because the _wrapper_ around
     * the handler will call `onDialogs` handlers after delegating to `handleTeamsFileConsentAccept` or `handleTeamsFileConsentDecline`.
     *
     * @param context A context object for this turn.
     * @param fileConsentCardResponse Represents the value of the invoke activity sent when the user acts on a file consent card.
     * @returns A promise that represents the work queued.
     */
    protected async handleTeamsFileConsent(
        context: TurnContext,
        fileConsentCardResponse: FileConsentCardResponse
    ): Promise<void> {
        switch (fileConsentCardResponse.action) {
            case 'accept':
                return await this.handleTeamsFileConsentAccept(context, fileConsentCardResponse);
            case 'decline':
                return await this.handleTeamsFileConsentDecline(context, fileConsentCardResponse);
            default:
                throw new Error('BadRequest');
        }
    }

    /**
     * Receives invoke activities with Activity name of 'fileConsent/invoke' with confirmation from user
     *
     * @remarks
     * This type of invoke activity occur during the File Consent flow.
     * @param _context A context object for this turn.
     * @param _fileConsentCardResponse Represents the value of the invoke activity sent when the user acts on a file consent card.
     * @returns A promise that represents the work queued.
     */
    protected async handleTeamsFileConsentAccept(
        _context: TurnContext,
        _fileConsentCardResponse: FileConsentCardResponse
    ): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'fileConsent/invoke' with decline from user
     *
     * @remarks
     * This type of invoke activity occur during the File Consent flow.
     * @param _context A context object for this turn.
     * @param _fileConsentCardResponse Represents the value of the invoke activity sent when the user acts on a file consent card.
     * @returns A promise that represents the work queued.
     */
    protected async handleTeamsFileConsentDecline(
        _context: TurnContext,
        _fileConsentCardResponse: FileConsentCardResponse
    ): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'actionableMessage/executeAction'.
     *
     * @param _context A context object for this turn.
     * @param _query The O365 connector card HttpPOST invoke query.
     * @returns A promise that represents the work queued.
     */
    protected async handleTeamsO365ConnectorCardAction(
        _context: TurnContext,
        _query: O365ConnectorCardActionQuery
    ): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Invoked when a signIn invoke activity is received from the connector.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onSignInInvoke(context: TurnContext): Promise<void> {
        switch (context.activity.name) {
            case verifyStateOperationName:
                return await this.handleTeamsSigninVerifyState(context, context.activity.value);
            case tokenExchangeOperationName:
                return await this.handleTeamsSigninTokenExchange(context, context.activity.value);
        }
    }

    /**
     * Receives invoke activities with Activity name of 'signin/verifyState'.
     *
     * @param _context A context object for this turn.
     * @param _query Signin state (part of signin action auth flow) verification invoke query.
     * @returns A promise that represents the work queued.
     */
    protected async handleTeamsSigninVerifyState(
        _context: TurnContext,
        _query: SigninStateVerificationQuery
    ): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'signin/tokenExchange'
     *
     * @param _context A context object for this turn.
     * @param _query Signin state (part of signin action auth flow) verification invoke query
     * @returns A promise that represents the work queued.
     */
    protected async handleTeamsSigninTokenExchange(
        _context: TurnContext,
        _query: SigninStateVerificationQuery
    ): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'composeExtension/onCardButtonClicked'
     *
     * @param _context A context object for this turn.
     * @param _cardData Object representing the card data.
     * @returns A promise that represents the work queued.
     */
    protected async handleTeamsMessagingExtensionCardButtonClicked(
        _context: TurnContext,
        _cardData: any
    ): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'task/fetch'
     *
     * @param _context A context object for this turn.
     * @param _taskModuleRequest The task module invoke request value payload.
     * @returns A Task Module Response for the request.
     */
    protected async handleTeamsTaskModuleFetch(
        _context: TurnContext,
        _taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'task/submit'
     *
     * @param _context A context object for this turn.
     * @param _taskModuleRequest The task module invoke request value payload.
     * @returns A Task Module Response for the request.
     */
    protected async handleTeamsTaskModuleSubmit(
        _context: TurnContext,
        _taskModuleRequest: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'tab/fetch'
     *
     * @param _context A context object for this turn.
     * @param _tabRequest The tab invoke request value payload.
     * @returns A Tab Response for the request.
     */
    protected async handleTeamsTabFetch(_context: TurnContext, _tabRequest: TabRequest): Promise<TabResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'tab/submit'
     *
     * @param _context A context object for this turn.
     * @param _tabSubmit The tab submit invoke request value payload.
     * @returns A Tab Response for the request.
     */
    protected async handleTeamsTabSubmit(_context: TurnContext, _tabSubmit: TabSubmit): Promise<TabResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'composeExtension/queryLink'
     *
     * @remarks
     * Used in creating a Search-based Message Extension.
     * @param _context A context object for this turn.
     * @param _query he invoke request body type for app-based link query.
     * @returns The Messaging Extension Response for the query.
     */
    protected async handleTeamsAppBasedLinkQuery(
        _context: TurnContext,
        _query: AppBasedLinkQuery
    ): Promise<MessagingExtensionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with Activity name of 'composeExtension/anonymousQueryLink'
     *
     * @remarks
     * Used in creating a Search-based Message Extension.
     * @param _context A context object for this turn.
     * @param _query he invoke request body type for app-based link query.
     * @returns The Messaging Extension Response for the query.
     */
    protected async handleTeamsAnonymousAppBasedLinkQuery(
        _context: TurnContext,
        _query: AppBasedLinkQuery
    ): Promise<MessagingExtensionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with the name 'composeExtension/query'.
     *
     * @remarks
     * Used in creating a Search-based Message Extension.
     * @param _context A context object for this turn.
     * @param _query The query for the search command.
     * @returns The Messaging Extension Response for the query.
     */
    protected async handleTeamsMessagingExtensionQuery(
        _context: TurnContext,
        _query: MessagingExtensionQuery
    ): Promise<MessagingExtensionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with the name 'composeExtension/selectItem'.
     *
     * @remarks
     * Used in creating a Search-based Message Extension.
     * @param _context A context object for this turn.
     * @param _query he object representing the query.
     * @returns The Messaging Extension Response for the query.
     */
    protected async handleTeamsMessagingExtensionSelectItem(
        _context: TurnContext,
        _query: any
    ): Promise<MessagingExtensionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with the name 'composeExtension/submitAction' and dispatches to botMessagePreview-flows as applicable.
     *
     * @remarks
     * A handler registered through this method does not dispatch to the next handler (either `handleTeamsMessagingExtensionSubmitAction`, `handleTeamsMessagingExtensionBotMessagePreviewEdit`, or `handleTeamsMessagingExtensionBotMessagePreviewSend`).
     * This method exists for developers to optionally add more logic before the TeamsActivityHandler routes the activity to one of the
     * previously mentioned handlers.
     * @param context A context object for this turn.
     * @param action The messaging extension action.
     * @returns The Messaging Extension Action Response for the action.
     */
    protected async handleTeamsMessagingExtensionSubmitActionDispatch(
        context: TurnContext,
        action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        if (action.botMessagePreviewAction) {
            switch (action.botMessagePreviewAction) {
                case 'edit':
                    return await this.handleTeamsMessagingExtensionBotMessagePreviewEdit(context, action);
                case 'send':
                    return await this.handleTeamsMessagingExtensionBotMessagePreviewSend(context, action);
                default:
                    throw new Error('BadRequest');
            }
        } else {
            return await this.handleTeamsMessagingExtensionSubmitAction(context, action);
        }
    }

    /**
     * Receives invoke activities with the name 'composeExtension/submitAction'.
     *
     * @param _context A context object for this turn.
     * @param _action The messaging extension action.
     * @returns The Messaging Extension Action Response for the action.
     */
    protected async handleTeamsMessagingExtensionSubmitAction(
        _context: TurnContext,
        _action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value.
     * The value for 'botMessagePreview' is 'edit'.
     *
     * @param _context A context object for this turn.
     * @param _action The messaging extension action.
     * @returns The Messaging Extension Action Response for the action.
     */
    protected async handleTeamsMessagingExtensionBotMessagePreviewEdit(
        _context: TurnContext,
        _action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value.
     * The value for 'botMessagePreview' is 'send'.
     *
     * @param _context A context object for this turn.
     * @param _action The messaging extension action.
     * @returns The Messaging Extension Action Response for the action.
     */
    protected async handleTeamsMessagingExtensionBotMessagePreviewSend(
        _context: TurnContext,
        _action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with the name 'composeExtension/fetchTask'
     *
     * @param _context A context object for this turn.
     * @param _action The messaging extension action.
     * @returns The Messaging Extension Action Response for the action.
     */
    protected async handleTeamsMessagingExtensionFetchTask(
        _context: TurnContext,
        _action: MessagingExtensionAction
    ): Promise<MessagingExtensionActionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with the name 'composeExtension/querySettingUrl'
     *
     * @param _context A context object for this turn.
     * @param _query The Messaging extension query.
     * @returns The Messaging Extension Action Response for the query.
     */
    protected async handleTeamsMessagingExtensionConfigurationQuerySettingUrl(
        _context: TurnContext,
        _query: MessagingExtensionQuery
    ): Promise<MessagingExtensionResponse> {
        throw new Error('NotImplemented');
    }

    /**
     * Receives invoke activities with the name 'composeExtension/setting'
     *
     * @param _context A context object for this turn.
     * @param _settings Object representing the configuration settings.
     */
    protected handleTeamsMessagingExtensionConfigurationSetting(_context: TurnContext, _settings: any): Promise<void> {
        throw new Error('NotImplemented');
    }

    /**
     * Override this method to change the dispatching of ConversationUpdate activities.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async dispatchConversationUpdateActivity(context: TurnContext): Promise<void> {
        if (context.activity.channelId == 'msteams') {
            const channelData = context.activity.channelData as TeamsChannelData;

            if (context.activity.membersAdded && context.activity.membersAdded.length > 0) {
                return await this.onTeamsMembersAdded(context);
            }

            if (context.activity.membersRemoved && context.activity.membersRemoved.length > 0) {
                return await this.onTeamsMembersRemoved(context);
            }

            if (!channelData || !channelData.eventType) {
                return await super.dispatchConversationUpdateActivity(context);
            }

            switch (channelData.eventType) {
                case 'channelCreated':
                    return await this.onTeamsChannelCreated(context);

                case 'channelDeleted':
                    return await this.onTeamsChannelDeleted(context);

                case 'channelRenamed':
                    return await this.onTeamsChannelRenamed(context);

                case 'teamArchived':
                    return await this.onTeamsTeamArchived(context);

                case 'teamDeleted':
                    return await this.onTeamsTeamDeleted(context);

                case 'teamHardDeleted':
                    return await this.onTeamsTeamHardDeleted(context);

                case 'channelRestored':
                    return await this.onTeamsChannelRestored(context);

                case 'teamRenamed':
                    return await this.onTeamsTeamRenamed(context);

                case 'teamRestored':
                    return await this.onTeamsTeamRestored(context);

                case 'teamUnarchived':
                    return await this.onTeamsTeamUnarchived(context);

                default:
                    return await super.dispatchConversationUpdateActivity(context);
            }
        } else {
            return await super.dispatchConversationUpdateActivity(context);
        }
    }

    /**
     * Override this method to change the dispatching of MessageUpdate activities.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async dispatchMessageUpdateActivity(context: TurnContext): Promise<void> {
        if (context.activity.channelId == 'msteams') {
            const channelData = context.activity.channelData as TeamsChannelData;

            switch (channelData.eventType) {
                case 'undeleteMessage':
                    return await this.onTeamsMessageUndelete(context);

                case 'editMessage':
                    return await this.onTeamsMessageEdit(context);

                default:
                    return super.dispatchMessageUpdateActivity(context);
            }
        } else {
            return await super.dispatchMessageUpdateActivity(context);
        }
    }

    /**
     * Override this method to change the dispatching of MessageDelete activities.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async dispatchMessageDeleteActivity(context: TurnContext): Promise<void> {
        if (context.activity.channelId == 'msteams') {
            const channelData = context.activity.channelData as TeamsChannelData;

            switch (channelData.eventType) {
                case 'softDeleteMessage':
                    return await this.onTeamsMessageSoftDelete(context);

                default:
                    return super.dispatchMessageDeleteActivity(context);
            }
        } else {
            return await super.dispatchMessageDeleteActivity(context);
        }
    }

    /**
     * Called in `dispatchMessageUpdateActivity()` to trigger the `'TeamsMessageUndelete'` handlers.
     * Override this in a derived class to provide logic for when a deleted message in a conversation is undeleted.
     * For example, when the user decides to "undo" a deleted message.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsMessageUndelete(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsMessageUndelete', this.defaultNextEvent(context));
    }

    /**
     * Called in `dispatchMessageUpdateActivity()` to trigger the `'TeamsMessageEdit'` handlers.
     * Override this in a derived class to provide logic for when a message in a conversation is edited.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsMessageEdit(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsMessageEdit', this.defaultNextEvent(context));
    }

    /**
     * Called in `dispatchMessageDeleteActivity()` to trigger the `'TeamsMessageEdit'` handlers.
     * Override this in a derived class to provide logic for when a message in a conversation is soft deleted.
     * This means that the message as the option of being undeleted.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsMessageSoftDelete(context: TurnContext): Promise<void> {
        await this.handle(context, 'onTeamsMessageSoftDelete', this.defaultNextEvent(context));
    }

    /**
     * Called in `dispatchConversationUpdateActivity()` to trigger the `'TeamsMembersAdded'` handlers.
     * Override this in a derived class to provide logic for when members other than the bot
     * join the channel, such as your bot's welcome logic.
     *
     * @remarks
     * If no handlers are registered for the `'TeamsMembersAdded'` event, the `'MembersAdded'` handlers will run instead.
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsMembersAdded(context: TurnContext): Promise<void> {
        if ('TeamsMembersAdded' in this.handlers && this.handlers['TeamsMembersAdded'].length > 0) {
            for (let i = 0; i < context.activity.membersAdded!.length; i++) {
                const channelAccount = context.activity.membersAdded![i];

                // check whether we have a TeamChannelAccount, or the member is the bot
                if (
                    'givenName' in channelAccount ||
                    'surname' in channelAccount ||
                    'email' in channelAccount ||
                    'userPrincipalName' in channelAccount ||
                    context.activity.recipient.id === channelAccount.id
                ) {
                    // we must have a TeamsChannelAccount, or a bot so skip to the next one
                    continue;
                }

                try {
                    context.activity.membersAdded![i] = await TeamsInfo.getMember(context, channelAccount.id);
                } catch (err: unknown) {
                    const errCode: string = (err as any).body && (err as any).body.error && (err as any).body.error.code;
                    if (errCode === 'ConversationNotFound') {
                        // unable to find the member added in ConversationUpdate Activity in the response from the getMember call
                        const teamsChannelAccount: TeamsChannelAccount = {
                            id: channelAccount.id,
                            name: channelAccount.name,
                            aadObjectId: channelAccount.aadObjectId,
                            role: channelAccount.role,
                        };

                        context.activity.membersAdded![i] = teamsChannelAccount;
                    } else {
                        throw err;
                    }
                }
            }

            await this.handle(context, 'TeamsMembersAdded', this.defaultNextEvent(context));
        } else {
            await this.handle(context, 'MembersAdded', this.defaultNextEvent(context));
        }
    }

    /**
     * Called in `dispatchConversationUpdateActivity()` to trigger the `'TeamsMembersRemoved'` handlers.
     * Override this in a derived class to provide logic for when members other than the bot
     * leave the channel, such as your bot's good-bye logic.
     *
     * @remarks
     * If no handlers are registered for the `'TeamsMembersRemoved'` event, the `'MembersRemoved'` handlers will run instead.
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsMembersRemoved(context: TurnContext): Promise<void> {
        if ('TeamsMembersRemoved' in this.handlers && this.handlers['TeamsMembersRemoved'].length > 0) {
            await this.handle(context, 'TeamsMembersRemoved', this.defaultNextEvent(context));
        } else {
            await this.handle(context, 'MembersRemoved', this.defaultNextEvent(context));
        }
    }

    /**
     * Invoked when a Channel Created event activity is received from the connector.
     * Channel Created corresponds to the user creating a new channel.
     * Override this in a derived class to provide logic for when a channel is created.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsChannelCreated(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsChannelCreated', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Channel Deleted event activity is received from the connector.
     * Channel Deleted corresponds to the user deleting a channel.
     * Override this in a derived class to provide logic for when a channel is deleted.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsChannelDeleted(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsChannelDeleted', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Channel Renamed event activity is received from the connector.
     * Channel Renamed corresponds to the user renaming a new channel.
     * Override this in a derived class to provide logic for when a channel is renamed.
     *
     * @param context A context object for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsChannelRenamed(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsChannelRenamed', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Team Archived event activity is received from the connector.
     * Team Archived corresponds to the user archiving a team.
     * Override this in a derived class to provide logic for when a team is archived.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsTeamArchived(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsTeamArchived', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Team Deleted event activity is received from the connector.
     * Team Deleted corresponds to the user deleting a team.
     * Override this in a derived class to provide logic for when a team is deleted.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsTeamDeleted(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsTeamDeleted', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Team Hard Deleted event activity is received from the connector.
     * Team Hard Deleted corresponds to the user hard-deleting a team.
     * Override this in a derived class to provide logic for when a team is hard-deleted.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsTeamHardDeleted(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsTeamHardDeleted', this.defaultNextEvent(context));
    }

    /**
     *
     * Invoked when a Channel Restored event activity is received from the connector.
     * Channel Restored corresponds to the user restoring a previously deleted channel.
     * Override this in a derived class to provide logic for when a channel is restored.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsChannelRestored(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsChannelRestored', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Team Renamed event activity is received from the connector.
     * Team Renamed corresponds to the user renaming a team.
     * Override this in a derived class to provide logic for when a team is renamed.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsTeamRenamed(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsTeamRenamed', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Team Restored event activity is received from the connector.
     * Team Restored corresponds to the user restoring a team.
     * Override this in a derived class to provide logic for when a team is restored.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsTeamRestored(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsTeamRestored', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Team Unarchived event activity is received from the connector.
     * Team Unarchived corresponds to the user unarchiving a team.
     * Override this in a derived class to provide logic for when a team is unarchived.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsTeamUnarchived(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsTeamUnarchived', this.defaultNextEvent(context));
    }

    /**
     * Registers a handler for TeamsMessageUndelete events, such as for when a message in a conversation that is
     * observed by the bot goes from a soft delete state to the normal state.
     *
     * @param handler A callback to handle the teams undelete message event.
     * @returns A promise that represents the work queued.
     */
    onTeamsMessageUndeleteEvent(handler: (context: TurnContext, next: () => Promise<void>) => Promise<void>): this {
        return this.on('TeamsMessageUndelete', async (context, next) => {
            await handler(context, next);
        });
    }

    /**
     * Registers a handler for TeamsMessageEdit events, such as for when a message in a conversation that is
     * observed by the bot is edited.
     *
     * @param handler A callback to handle the teams edit message event.
     * @returns A promise that represents the work queued.
     */
    onTeamsMessageEditEvent(handler: (context: TurnContext, next: () => Promise<void>) => Promise<void>): this {
        return this.on('TeamsMessageEdit', async (context, next) => {
            await handler(context, next);
        });
    }

    /**
     * Registers a handler for TeamsMessageSoftDelete events, such as for when a message in a conversation that is
     * observed by the bot is soft deleted. This means that the deleted message, up to a certain time period,
     * can be undoed.
     *
     * @param handler A callback to handle the teams edit message event.
     * @returns A promise that represents the work queued.
     */
    onTeamsMessageSoftDeleteEvent(handler: (context: TurnContext, next: () => Promise<void>) => Promise<void>): this {
        return this.on('onTeamsMessageSoftDelete', async (context, next) => {
            await handler(context, next);
        });
    }

    /**
     * Registers a handler for TeamsMembersAdded events, such as for when members other than the bot
     * join the channel, such as your bot's welcome logic.
     *
     * @param handler A callback to handle the teams members added event.
     * @returns A promise that represents the work queued.
     */
    onTeamsMembersAddedEvent(
        handler: (
            membersAdded: TeamsChannelAccount[],
            teamInfo: TeamInfo,
            context: TurnContext,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on('TeamsMembersAdded', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(context.activity.membersAdded!, teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsMembersRemoved events, such as for when members other than the bot
     * leave the channel, such as your bot's good-bye logic.
     *
     * @param handler A callback to handle the teams members removed event.
     * @returns A promise that represents the work queued.
     */
    onTeamsMembersRemovedEvent(
        handler: (
            membersRemoved: TeamsChannelAccount[],
            teamInfo: TeamInfo,
            context: TurnContext,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on('TeamsMembersRemoved', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(context.activity.membersRemoved!, teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsChannelCreated events, such as for when a channel is created.
     *
     * @param handler A callback to handle the teams channel created event.
     * @returns A promise that represents the work queued.
     */
    onTeamsChannelCreatedEvent(
        handler: (
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            context: TurnContext,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on('TeamsChannelCreated', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.channel!, teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsChannelDeleted events, such as for when a channel is deleted.
     *
     * @param handler A callback to handle the teams channel deleted event.
     * @returns A promise that represents the work queued.
     */
    onTeamsChannelDeletedEvent(
        handler: (
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            context: TurnContext,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on('TeamsChannelDeleted', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.channel!, teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsChannelRenamed events, such as for when a channel is renamed.
     *
     * @param handler A callback to handle the teams channel renamed event.
     * @returns A promise that represents the work queued.
     */
    onTeamsChannelRenamedEvent(
        handler: (
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            context: TurnContext,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on('TeamsChannelRenamed', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.channel!, teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsTeamArchived events, such as for when a team is archived.
     *
     * @param handler A callback to handle the teams team archived event.
     * @returns A promise that represents the work queued.
     */
    onTeamsTeamArchivedEvent(
        handler: (teamInfo: TeamInfo, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsTeamArchived', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsTeamDeleted events, such as for when a team is deleted.
     *
     * @param handler A callback to handle the teams team deleted event.
     * @returns A promise that represents the work queued.
     */
    onTeamsTeamDeletedEvent(
        handler: (teamInfo: TeamInfo, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsTeamDeleted', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsTeamHardDeleted events, such as for when a team is hard-deleted.
     *
     * @param handler A callback to handle the teams team hard deleted event.
     * @returns A promise that represents the work queued.
     */
    onTeamsTeamHardDeletedEvent(
        handler: (teamInfo: TeamInfo, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsTeamHardDeleted', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsChannelRestored events, such as for when a channel is restored.
     *
     * @param handler A callback to handle the teams channel restored event.
     * @returns A promise that represents the work queued.
     */
    onTeamsChannelRestoredEvent(
        handler: (
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            context: TurnContext,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on('TeamsChannelRestored', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.channel!, teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsTeamRenamed events, such as for when a team is renamed.
     *
     * @param handler A callback to handle the teams team renamed event.
     * @returns A promise that represents the work queued.
     */
    onTeamsTeamRenamedEvent(
        handler: (teamInfo: TeamInfo, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsTeamRenamed', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsTeamRestored events, such as for when a team is restored.
     *
     * @param handler A callback to handle the teams team restored event.
     * @returns A promise that represents the work queued.
     */
    onTeamsTeamRestoredEvent(
        handler: (teamInfo: TeamInfo, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsTeamRestored', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.team!, context, next);
        });
    }

    /**
     * Registers a handler for TeamsTeamUnarchived events, such as for when a team is unarchived.
     *
     * @param handler A callback to handle the teams team unarchived event.
     * @returns A promise that represents the work queued.
     */
    onTeamsTeamUnarchivedEvent(
        handler: (teamInfo: TeamInfo, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsTeamUnarchived', async (context, next) => {
            const teamsChannelData = context.activity.channelData as TeamsChannelData;
            await handler(teamsChannelData.team!, context, next);
        });
    }

    /**
     * Runs the _event_ sub-type handlers, as appropriate, and then continues the event emission process.
     *
     * @param context The context object for the current turn.
     * @returns A promise that represents the work queued.
     *
     * @remarks
     * Override this method to support channel-specific behavior across multiple channels or to add
     * custom event sub-type events.
     */
    protected async dispatchEventActivity(context: TurnContext): Promise<void> {
        if (context.activity.channelId === Channels.Msteams) {
            switch (context.activity.name) {
                case 'application/vnd.microsoft.readReceipt':
                    return this.onTeamsReadReceipt(context);
                case 'application/vnd.microsoft.meetingStart':
                    return this.onTeamsMeetingStart(context);
                case 'application/vnd.microsoft.meetingEnd':
                    return this.onTeamsMeetingEnd(context);
            }
        }

        return super.dispatchEventActivity(context);
    }

    /**
     * Invoked when a Meeting Started event activity is received from the connector.
     * Override this in a derived class to provide logic for when a meeting is started.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsMeetingStart(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsMeetingStart', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a Meeting End event activity is received from the connector.
     * Override this in a derived class to provide logic for when a meeting is ended.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsMeetingEnd(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsMeetingEnd', this.defaultNextEvent(context));
    }

    /**
     * Invoked when a read receipt for a previously sent message is received from the connector.
     * Override this in a derived class to provide logic for when the bot receives a read receipt event.
     *
     * @param context The context for this turn.
     * @returns A promise that represents the work queued.
     */
    protected async onTeamsReadReceipt(context: TurnContext): Promise<void> {
        await this.handle(context, 'TeamsReadReceipt', this.defaultNextEvent(context));
    }

    /**
     * Registers a handler for when a Teams meeting starts.
     *
     * @param handler A callback that handles Meeting Start events.
     * @returns A promise that represents the work queued.
     */
    onTeamsMeetingStartEvent(
        handler: (meeting: MeetingStartEventDetails, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsMeetingStart', async (context, next) => {
            const meeting = TeamsMeetingStartT.parse(context.activity.value);
            await handler(
                {
                    id: meeting.Id,
                    joinUrl: meeting.JoinUrl,
                    meetingType: meeting.MeetingType,
                    startTime: new Date(meeting.StartTime),
                    title: meeting.Title,
                },
                context,
                next
            );
        });
    }

    /**
     * Registers a handler for when a Teams meeting ends.
     *
     * @param handler A callback that handles Meeting End events.
     * @returns A promise that represents the work queued.
     */
    onTeamsMeetingEndEvent(
        handler: (meeting: MeetingEndEventDetails, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsMeetingEnd', async (context, next) => {
            const meeting = TeamsMeetingEndT.parse(context.activity.value);
            await handler(
                {
                    id: meeting.Id,
                    joinUrl: meeting.JoinUrl,
                    meetingType: meeting.MeetingType,
                    endTime: new Date(meeting.EndTime),
                    title: meeting.Title,
                },
                context,
                next
            );
        });
    }

    /**
     * Registers a handler for when a Read Receipt is sent.
     *
     * @param handler A callback that handles Read Receipt events.
     * @returns A promise that represents the work queued.
     */
    onTeamsReadReceiptEvent(
        handler: (receiptInfo: ReadReceiptInfo, context: TurnContext, next: () => Promise<void>) => Promise<void>
    ): this {
        return this.on('TeamsReadReceipt', async (context, next) => {
            const receiptInfo = context.activity.value;
            await handler(new ReadReceiptInfo(receiptInfo.lastReadMessageId), context, next);
        });
    }
}
