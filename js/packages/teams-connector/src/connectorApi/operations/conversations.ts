/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as Mappers from "../models/conversationsMappers";
import * as Models from "../models";
import * as Parameters from "../models/parameters";
import * as msRest from "@azure/ms-rest-js";
import { ConnectorClientContext } from "../connectorClientContext";
import { ConversationIdHttpHeaderName } from "../../conversationConstants";

/** Class representing a Conversations. */
export class Conversations {
  private readonly client: ConnectorClientContext;

  /**
   * Create a Conversations.
   * @param {ConnectorClientContext} client Reference to the service client.
   */
  constructor(client: ConnectorClientContext) {
    this.client = client;
  }

  /**
   * List the Conversations in which this bot has participated.
   *
   * GET from this method with a skip token
   *
   * The return value is a ConversationsResult, which contains an array of ConversationMembers and a
   * skip token.  If the skip token is not empty, then
   * there are further values to be returned. Call this method again with the returned token to get
   * more values.
   *
   * Each ConversationMembers object contains the ID of the conversation and an array of
   * ChannelAccounts that describe the members of the conversation.
   * @summary GetConversations
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsGetConversationsResponse>
   */
  getConversations(options?: Models.ConversationsGetConversationsOptionalParams): Promise<Models.ConversationsGetConversationsResponse>;
  /**
   * @param callback The callback
   */
  getConversations(callback: msRest.ServiceCallback<Models.ConversationsResult>): void;
  /**
   * @param options The optional parameters
   * @param callback The callback
   */
  getConversations(options: Models.ConversationsGetConversationsOptionalParams, callback: msRest.ServiceCallback<Models.ConversationsResult>): void;
  getConversations(options?: Models.ConversationsGetConversationsOptionalParams | msRest.ServiceCallback<Models.ConversationsResult>, callback?: msRest.ServiceCallback<Models.ConversationsResult>): Promise<Models.ConversationsGetConversationsResponse> {
    return this.client.sendOperationRequest(
      {
        options
      },
      getConversationsOperationSpec,
      callback) as Promise<Models.ConversationsGetConversationsResponse>;
  }

  /**
   * Create a new Conversation.
   *
   * POST to this method with a
   * * Bot being the bot creating the conversation
   * * IsGroup set to true if this is not a direct message (default is false)
   * * Array containing the members to include in the conversation
   *
   * The return value is a ResourceResponse which contains a conversation id which is suitable for
   * use
   * in the message payload and REST API uris.
   *
   * Most channels only support the semantics of bots initiating a direct message conversation.  An
   * example of how to do that would be:
   *
   * ```
   * const resource = await connector.conversations.createConversation({
   *     bot,
   *     members: [{ id: 'user1' }]
   * });
   * await connector.conversations.sendToConversation(resource.Id, ... );
   * ```
   * @summary CreateConversation
   * @param parameters Parameters to create the conversation from
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsCreateConversationResponse>
   */
  createConversation(parameters: Models.ConversationParameters, options?: msRest.RequestOptionsBase): Promise<Models.ConversationsCreateConversationResponse>;
  /**
   * @param parameters Parameters to create the conversation from
   * @param callback The callback
   */
  createConversation(parameters: Models.ConversationParameters, callback: msRest.ServiceCallback<Models.ConversationResourceResponse>): void;
  /**
   * @param parameters Parameters to create the conversation from
   * @param options The optional parameters
   * @param callback The callback
   */
  createConversation(parameters: Models.ConversationParameters, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ConversationResourceResponse>): void;
  createConversation(parameters: Models.ConversationParameters, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ConversationResourceResponse>, callback?: msRest.ServiceCallback<Models.ConversationResourceResponse>): Promise<Models.ConversationsCreateConversationResponse> {
    return this.client.sendOperationRequest(
      {
        parameters,
        options
      },
      createConversationOperationSpec,
      callback) as Promise<Models.ConversationsCreateConversationResponse>;
  }

  /**
   * This method allows you to send an activity to the end of a conversation.
   *
   * This is slightly different from ReplyToActivity().
   * * SendToConversation(conversationId) - will append the activity to the end of the conversation
   * according to the timestamp or semantics of the channel.
   * * ReplyToActivity(conversationId,ActivityId) - adds the activity as a reply to another activity,
   * if the channel supports it. If the channel does not support nested replies, ReplyToActivity
   * falls back to SendToConversation.
   *
   * Use ReplyToActivity when replying to a specific activity in the conversation.
   *
   * Use SendToConversation in all other cases.
   * @summary SendToConversation
   * @param conversationId Conversation ID
   * @param activity Activity to send
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsSendToConversationResponse>
   */
  sendToConversation(conversationId: string, activity: Partial<Models.Activity>, options?: msRest.RequestOptionsBase): Promise<Models.ConversationsSendToConversationResponse>;
  /**
   * @param conversationId Conversation ID
   * @param activity Activity to send
   * @param callback The callback
   */
  sendToConversation(conversationId: string, activity: Partial<Models.Activity>, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  /**
   * @param conversationId Conversation ID
   * @param activity Activity to send
   * @param options The optional parameters
   * @param callback The callback
   */
  sendToConversation(conversationId: string, activity: Partial<Models.Activity>, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  sendToConversation(conversationId: string, activity: Partial<Models.Activity>, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ResourceResponse>, callback?: msRest.ServiceCallback<Models.ResourceResponse>): Promise<Models.ConversationsSendToConversationResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        activity,
        options
      },
      sendToConversationOperationSpec,
      callback) as Promise<Models.ConversationsSendToConversationResponse>;
  }

  /**
   * This method allows you to upload the historic activities to the conversation.
   *
   * Sender must ensure that the historic activities have unique ids and appropriate timestamps. The
   * ids are used by the client to deal with duplicate activities and the timestamps are used by the
   * client to render the activities in the right order.
   * @summary SendConversationHistory
   * @param conversationId Conversation ID
   * @param history Historic activities
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsSendConversationHistoryResponse>
   */
  sendConversationHistory(conversationId: string, history: Models.Transcript, options?: msRest.RequestOptionsBase): Promise<Models.ConversationsSendConversationHistoryResponse>;
  /**
   * @param conversationId Conversation ID
   * @param history Historic activities
   * @param callback The callback
   */
  sendConversationHistory(conversationId: string, history: Models.Transcript, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  /**
   * @param conversationId Conversation ID
   * @param history Historic activities
   * @param options The optional parameters
   * @param callback The callback
   */
  sendConversationHistory(conversationId: string, history: Models.Transcript, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  sendConversationHistory(conversationId: string, history: Models.Transcript, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ResourceResponse>, callback?: msRest.ServiceCallback<Models.ResourceResponse>): Promise<Models.ConversationsSendConversationHistoryResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        history,
        options
      },
      sendConversationHistoryOperationSpec,
      callback) as Promise<Models.ConversationsSendConversationHistoryResponse>;
  }

  /**
   * Edit an existing activity.
   *
   * Some channels allow you to edit an existing activity to reflect the new state of a bot
   * conversation.
   *
   * For example, you can remove buttons after someone has clicked "Approve" button.
   * @summary UpdateActivity
   * @param conversationId Conversation ID
   * @param activityId activityId to update
   * @param activity replacement Activity
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsUpdateActivityResponse>
   */
  updateActivity(conversationId: string, activityId: string, activity: Partial<Models.Activity>, options?: msRest.RequestOptionsBase): Promise<Models.ConversationsUpdateActivityResponse>;
  /**
   * @param conversationId Conversation ID
   * @param activityId activityId to update
   * @param activity replacement Activity
   * @param callback The callback
   */
  updateActivity(conversationId: string, activityId: string, activity: Partial<Models.Activity>, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  /**
   * @param conversationId Conversation ID
   * @param activityId activityId to update
   * @param activity replacement Activity
   * @param options The optional parameters
   * @param callback The callback
   */
  updateActivity(conversationId: string, activityId: string, activity: Partial<Models.Activity>, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  updateActivity(conversationId: string, activityId: string, activity: Partial<Models.Activity>, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ResourceResponse>, callback?: msRest.ServiceCallback<Models.ResourceResponse>): Promise<Models.ConversationsUpdateActivityResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        activityId,
        activity,
        options
      },
      updateActivityOperationSpec,
      callback) as Promise<Models.ConversationsUpdateActivityResponse>;
  }

  /**
   * This method allows you to reply to an activity.
   *
   * This is slightly different from SendToConversation().
   * * SendToConversation(conversationId) - will append the activity to the end of the conversation
   * according to the timestamp or semantics of the channel.
   * * ReplyToActivity(conversationId,ActivityId) - adds the activity as a reply to another activity,
   * if the channel supports it. If the channel does not support nested replies, ReplyToActivity
   * falls back to SendToConversation.
   *
   * Use ReplyToActivity when replying to a specific activity in the conversation.
   *
   * Use SendToConversation in all other cases.
   * @summary ReplyToActivity
   * @param conversationId Conversation ID
   * @param activityId activityId the reply is to (OPTIONAL)
   * @param activity Activity to send
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsReplyToActivityResponse>
   */
  replyToActivity(conversationId: string, activityId: string, activity: Partial<Models.Activity>, options?: msRest.RequestOptionsBase): Promise<Models.ConversationsReplyToActivityResponse>;
  /**
   * @param conversationId Conversation ID
   * @param activityId activityId the reply is to (OPTIONAL)
   * @param activity Activity to send
   * @param callback The callback
   */
  replyToActivity(conversationId: string, activityId: string, activity: Partial<Models.Activity>, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  /**
   * @param conversationId Conversation ID
   * @param activityId activityId the reply is to (OPTIONAL)
   * @param activity Activity to send
   * @param options The optional parameters
   * @param callback The callback
   */
  replyToActivity(conversationId: string, activityId: string, activity: Partial<Models.Activity>, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  replyToActivity(conversationId: string, activityId: string, activity: Partial<Models.Activity>, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ResourceResponse>, callback?: msRest.ServiceCallback<Models.ResourceResponse>): Promise<Models.ConversationsReplyToActivityResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        activityId,
        activity,
        options
      },
      replyToActivityOperationSpec,
      callback) as Promise<Models.ConversationsReplyToActivityResponse>;
  }

  /**
   * Delete an existing activity.
   *
   * Some channels allow you to delete an existing activity, and if successful this method will
   * remove the specified activity.
   * @summary DeleteActivity
   * @param conversationId Conversation ID
   * @param activityId activityId to delete
   * @param [options] The optional parameters
   * @returns Promise<msRest.RestResponse>
   */
  deleteActivity(conversationId: string, activityId: string, options?: msRest.RequestOptionsBase): Promise<msRest.RestResponse>;
  /**
   * @param conversationId Conversation ID
   * @param activityId activityId to delete
   * @param callback The callback
   */
  deleteActivity(conversationId: string, activityId: string, callback: msRest.ServiceCallback<void>): void;
  /**
   * @param conversationId Conversation ID
   * @param activityId activityId to delete
   * @param options The optional parameters
   * @param callback The callback
   */
  deleteActivity(conversationId: string, activityId: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<void>): void;
  deleteActivity(conversationId: string, activityId: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<void>, callback?: msRest.ServiceCallback<void>): Promise<msRest.RestResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        activityId,
        options
      },
      deleteActivityOperationSpec,
      callback);
  }

  /**
   * Enumerate the members of a conversation.
   *
   * This REST API takes a ConversationId and returns an array of ChannelAccount objects representing
   * the members of the conversation.
   * @summary GetConversationMembers
   * @param conversationId Conversation ID
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsGetConversationMembersResponse>
   */
  getConversationMembers(conversationId: string, options?: msRest.RequestOptionsBase): Promise<Models.ConversationsGetConversationMembersResponse>;
  /**
   * @param conversationId Conversation ID
   * @param callback The callback
   */
  getConversationMembers(conversationId: string, callback: msRest.ServiceCallback<Models.ChannelAccount[]>): void;
  /**
   * @param conversationId Conversation ID
   * @param options The optional parameters
   * @param callback The callback
   */
  getConversationMembers(conversationId: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ChannelAccount[]>): void;
  getConversationMembers(conversationId: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ChannelAccount[]>, callback?: msRest.ServiceCallback<Models.ChannelAccount[]>): Promise<Models.ConversationsGetConversationMembersResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        options
      },
      getConversationMembersOperationSpec,
      callback) as Promise<Models.ConversationsGetConversationMembersResponse>;
  }

  /**
   * @param conversationId Conversation ID
   * @param memberId MemberId for the user
   * @param options The optional parameters
   * @param callback The callback
   */
  getConversationMember(conversationId: string, memberId: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ChannelAccount[]>, callback?: msRest.ServiceCallback<Models.ChannelAccount[]>): Promise<Models.ConversationsGetConversationMemberResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        memberId,
        options
      },
      getConversationMemberOperationSpec,
      callback) as Promise<Models.ConversationsGetConversationMemberResponse>;
  }

  /**
   * Enumerate the members of a conversation one page at a time.
   *
   * This REST API takes a ConversationId. Optionally a pageSize and/or continuationToken can be
   * provided. It returns a PagedMembersResult, which contains an array
   * of ChannelAccounts representing the members of the conversation and a continuation token that
   * can be used to get more values.
   *
   * One page of ChannelAccounts records are returned with each call. The number of records in a page
   * may vary between channels and calls. The pageSize parameter can be used as
   * a suggestion. If there are no additional results the response will not contain a continuation
   * token. If there are no members in the conversation the Members will be empty or not present in
   * the response.
   *
   * A response to a request that has a continuation token from a prior request may rarely return
   * members from a previous request.
   * @summary GetConversationPagedMembers
   * @param conversationId Conversation ID
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsGetConversationPagedMembersResponse>
   */
  getConversationPagedMembers(conversationId: string, options?: Models.ConversationsGetConversationPagedMembersOptionalParams): Promise<Models.ConversationsGetConversationPagedMembersResponse>;
  /**
   * @param conversationId Conversation ID
   * @param callback The callback
   */
  getConversationPagedMembers(conversationId: string, callback: msRest.ServiceCallback<Models.PagedMembersResult>): void;
  /**
   * @param conversationId Conversation ID
   * @param options The optional parameters
   * @param callback The callback
   */
  getConversationPagedMembers(conversationId: string, options: Models.ConversationsGetConversationPagedMembersOptionalParams, callback: msRest.ServiceCallback<Models.PagedMembersResult>): void;
  getConversationPagedMembers(conversationId: string, options?: Models.ConversationsGetConversationPagedMembersOptionalParams | msRest.ServiceCallback<Models.PagedMembersResult>, callback?: msRest.ServiceCallback<Models.PagedMembersResult>): Promise<Models.ConversationsGetConversationPagedMembersResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        options
      },
      getConversationPagedMembersOperationSpec,
      callback) as Promise<Models.ConversationsGetConversationPagedMembersResponse>;
  }

  /**
   * Deletes a member from a conversation.
   *
   * This REST API takes a ConversationId and a memberId (of type string) and removes that member
   * from the conversation. If that member was the last member
   * of the conversation, the conversation will also be deleted.
   * @summary DeleteConversationMember
   * @param conversationId Conversation ID
   * @param memberId ID of the member to delete from this conversation
   * @param [options] The optional parameters
   * @returns Promise<msRest.RestResponse>
   */
  deleteConversationMember(conversationId: string, memberId: string, options?: msRest.RequestOptionsBase): Promise<msRest.RestResponse>;
  /**
   * @param conversationId Conversation ID
   * @param memberId ID of the member to delete from this conversation
   * @param callback The callback
   */
  deleteConversationMember(conversationId: string, memberId: string, callback: msRest.ServiceCallback<void>): void;
  /**
   * @param conversationId Conversation ID
   * @param memberId ID of the member to delete from this conversation
   * @param options The optional parameters
   * @param callback The callback
   */
  deleteConversationMember(conversationId: string, memberId: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<void>): void;
  deleteConversationMember(conversationId: string, memberId: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<void>, callback?: msRest.ServiceCallback<void>): Promise<msRest.RestResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        memberId,
        options
      },
      deleteConversationMemberOperationSpec,
      callback);
  }

  /**
   * Enumerate the members of an activity.
   *
   * This REST API takes a ConversationId and a ActivityId, returning an array of ChannelAccount
   * objects representing the members of the particular activity in the conversation.
   * @summary GetActivityMembers
   * @param conversationId Conversation ID
   * @param activityId Activity ID
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsGetActivityMembersResponse>
   */
  getActivityMembers(conversationId: string, activityId: string, options?: msRest.RequestOptionsBase): Promise<Models.ConversationsGetActivityMembersResponse>;
  /**
   * @param conversationId Conversation ID
   * @param activityId Activity ID
   * @param callback The callback
   */
  getActivityMembers(conversationId: string, activityId: string, callback: msRest.ServiceCallback<Models.ChannelAccount[]>): void;
  /**
   * @param conversationId Conversation ID
   * @param activityId Activity ID
   * @param options The optional parameters
   * @param callback The callback
   */
  getActivityMembers(conversationId: string, activityId: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ChannelAccount[]>): void;
  getActivityMembers(conversationId: string, activityId: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ChannelAccount[]>, callback?: msRest.ServiceCallback<Models.ChannelAccount[]>): Promise<Models.ConversationsGetActivityMembersResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        activityId,
        options
      },
      getActivityMembersOperationSpec,
      callback) as Promise<Models.ConversationsGetActivityMembersResponse>;
  }

  /**
   * Upload an attachment directly into a channel's blob storage.
   *
   * This is useful because it allows you to store data in a compliant store when dealing with
   * enterprises.
   *
   * The response is a ResourceResponse which contains an AttachmentId which is suitable for using
   * with the attachments API.
   * @summary UploadAttachment
   * @param conversationId Conversation ID
   * @param attachmentUpload Attachment data
   * @param [options] The optional parameters
   * @returns Promise<Models.ConversationsUploadAttachmentResponse>
   */
  uploadAttachment(conversationId: string, attachmentUpload: Models.AttachmentData, options?: msRest.RequestOptionsBase): Promise<Models.ConversationsUploadAttachmentResponse>;
  /**
   * @param conversationId Conversation ID
   * @param attachmentUpload Attachment data
   * @param callback The callback
   */
  uploadAttachment(conversationId: string, attachmentUpload: Models.AttachmentData, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  /**
   * @param conversationId Conversation ID
   * @param attachmentUpload Attachment data
   * @param options The optional parameters
   * @param callback The callback
   */
  uploadAttachment(conversationId: string, attachmentUpload: Models.AttachmentData, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.ResourceResponse>): void;
  uploadAttachment(conversationId: string, attachmentUpload: Models.AttachmentData, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.ResourceResponse>, callback?: msRest.ServiceCallback<Models.ResourceResponse>): Promise<Models.ConversationsUploadAttachmentResponse> {
    return this.client.sendOperationRequest(
      {
        conversationId,
        attachmentUpload,
        options
      },
      uploadAttachmentOperationSpec,
      callback) as Promise<Models.ConversationsUploadAttachmentResponse>;
  }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers);
const getConversationsOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "v3/conversations",
  queryParameters: [
    Parameters.continuationToken
  ],
  responses: {
    200: {
      bodyMapper: Mappers.ConversationsResult
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const createConversationOperationSpec: msRest.OperationSpec = {
  httpMethod: "POST",
  path: "v3/conversations",
  requestBody: {
    parameterPath: "parameters",
    mapper: {
      ...Mappers.ConversationParameters,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.ConversationResourceResponse
    },
    201: {
      bodyMapper: Mappers.ConversationResourceResponse
    },
    202: {
      bodyMapper: Mappers.ConversationResourceResponse
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const sendToConversationOperationSpec: msRest.OperationSpec = {
  httpMethod: "POST",
  path: "v3/conversations/{conversationId}/activities",
  urlParameters: [
    Parameters.conversationId
  ],
  requestBody: {
    parameterPath: "activity",
    mapper: {
      ...Mappers.Activity,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.ResourceResponse
    },
    201: {
      bodyMapper: Mappers.ResourceResponse
    },
    202: {
      bodyMapper: Mappers.ResourceResponse
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const sendConversationHistoryOperationSpec: msRest.OperationSpec = {
  httpMethod: "POST",
  path: "v3/conversations/{conversationId}/activities/history",
  urlParameters: [
    Parameters.conversationId
  ],
  requestBody: {
    parameterPath: "history",
    mapper: {
      ...Mappers.Transcript,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.ResourceResponse
    },
    201: {
      bodyMapper: Mappers.ResourceResponse
    },
    202: {
      bodyMapper: Mappers.ResourceResponse
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const updateActivityOperationSpec: msRest.OperationSpec = {
  httpMethod: "PUT",
  path: "v3/conversations/{conversationId}/activities/{activityId}",
  urlParameters: [
    Parameters.conversationId,
    Parameters.activityId
  ],
  requestBody: {
    parameterPath: "activity",
    mapper: {
      ...Mappers.Activity,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.ResourceResponse
    },
    201: {
      bodyMapper: Mappers.ResourceResponse
    },
    202: {
      bodyMapper: Mappers.ResourceResponse
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const replyToActivityOperationSpec: msRest.OperationSpec = {
  httpMethod: "POST",
  path: "v3/conversations/{conversationId}/activities/{activityId}",
  urlParameters: [
    Parameters.conversationId,
    Parameters.activityId
  ],
  headerParameters: [{
    parameterPath: 'conversationId',
    mapper: {
      serializedName: ConversationIdHttpHeaderName,
      type: {
        name: 'String'
      }
    },
  }],
  requestBody: {
    parameterPath: "activity",
    mapper: {
      ...Mappers.Activity,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.ResourceResponse
    },
    201: {
      bodyMapper: Mappers.ResourceResponse
    },
    202: {
      bodyMapper: Mappers.ResourceResponse
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const deleteActivityOperationSpec: msRest.OperationSpec = {
  httpMethod: "DELETE",
  path: "v3/conversations/{conversationId}/activities/{activityId}",
  urlParameters: [
    Parameters.conversationId,
    Parameters.activityId
  ],
  responses: {
    200: {},
    202: {},
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const getConversationMembersOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "v3/conversations/{conversationId}/members",
  urlParameters: [
    Parameters.conversationId
  ],
  responses: {
    200: {
      bodyMapper: {
        serializedName: "parsedResponse",
        type: {
            name: "Sequence",
            element: {
                type: {
                    name: "Composite",
                    className: "ChannelAccount"
                }
            }
        }
      }
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const getConversationMemberOperationSpec: msRest.OperationSpec = {
    httpMethod: "GET",
    path: "v3/conversations/{conversationId}/members/{memberId}",
    urlParameters: [
      Parameters.conversationId,
      Parameters.memberId
    ],
    responses: {
      200: {
        bodyMapper: Mappers.ChannelAccount,
      },
      default: {
        bodyMapper: Mappers.ErrorResponse
      }
    },
    serializer
  };

const getConversationPagedMembersOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "v3/conversations/{conversationId}/pagedmembers",
  urlParameters: [
    Parameters.conversationId
  ],
  queryParameters: [
    Parameters.pageSize,
    Parameters.continuationToken
  ],
  responses: {
    200: {
      bodyMapper: Mappers.PagedMembersResult
    },
    default: {}
  },
  serializer
};

const deleteConversationMemberOperationSpec: msRest.OperationSpec = {
  httpMethod: "DELETE",
  path: "v3/conversations/{conversationId}/members/{memberId}",
  urlParameters: [
    Parameters.conversationId,
    Parameters.memberId
  ],
  responses: {
    200: {},
    204: {},
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const getActivityMembersOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "v3/conversations/{conversationId}/activities/{activityId}/members",
  urlParameters: [
    Parameters.conversationId,
    Parameters.activityId
  ],
  responses: {
    200: {
      bodyMapper: {
        serializedName: "parsedResponse",
        type: {
          name: "Sequence",
          element: {
            type: {
              name: "Composite",
              className: "ChannelAccount"
            }
          }
        }
      }
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};

const uploadAttachmentOperationSpec: msRest.OperationSpec = {
  httpMethod: "POST",
  path: "v3/conversations/{conversationId}/attachments",
  urlParameters: [
    Parameters.conversationId
  ],
  requestBody: {
    parameterPath: "attachmentUpload",
    mapper: {
      ...Mappers.AttachmentData,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.ResourceResponse
    },
    201: {
      bodyMapper: Mappers.ResourceResponse
    },
    202: {
      bodyMapper: Mappers.ResourceResponse
    },
    default: {
      bodyMapper: Mappers.ErrorResponse
    }
  },
  serializer
};
