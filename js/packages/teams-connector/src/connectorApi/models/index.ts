/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msRest from "@azure/ms-rest-js";
import { ServiceClientOptions } from "@azure/ms-rest-js";
import { AttachmentInfo, ChannelAccount, ConversationResourceResponse, ConversationsResult, PagedMembersResult, ResourceResponse } from "botframework-schema";
export * from "botframework-schema";

/**
 * An interface representing ConnectorClientOptions.
 */
export interface ConnectorClientOptions extends ServiceClientOptions {
  /**
   * (Optional) baseUri will be set automatically within BotFrameworkAdapter, 
   * but is required if using the ConnectorClient outside of the adapter.
   */
  baseUri?: string;
}

/**
 * Optional Parameters.
 */
export interface ConversationsGetConversationsOptionalParams extends msRest.RequestOptionsBase {
  /**
   * skip or continuation token
   */
  continuationToken: string;
}

/**
 * Optional Parameters.
 */
export interface ConversationsGetConversationPagedMembersOptionalParams extends msRest.RequestOptionsBase {
  /**
   * Suggested page size
   */
  pageSize: number;
  /**
   * Continuation Token
   */
  continuationToken: string;
}

/**
 * Contains response data for the getAttachmentInfo operation.
 */
export type AttachmentsGetAttachmentInfoResponse = AttachmentInfo & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: AttachmentInfo;
  };
};

/**
 * Contains response data for the getAttachment operation.
 */
export type AttachmentsGetAttachmentResponse = {
  /**
   * BROWSER ONLY
   *
   * The response body as a browser Blob.
   * Always undefined in node.js.
   */
  blobBody: Promise<Blob>;

  /**
   * NODEJS ONLY
   *
   * The response body as a node.js Readable stream.
   * Always undefined in the browser.
   */
  readableStreamBody: NodeJS.ReadableStream;

  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse;
};

/**
 * Contains response data for the getConversations operation.
 */
export type ConversationsGetConversationsResponse = ConversationsResult & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ConversationsResult;
  };
};

/**
 * Contains response data for the createConversation operation.
 */
export type ConversationsCreateConversationResponse = ConversationResourceResponse & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ConversationResourceResponse;
  };
};

/**
 * Contains response data for the sendToConversation operation.
 */
export type ConversationsSendToConversationResponse = ResourceResponse & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ResourceResponse;
  };
};

/**
 * Contains response data for the sendConversationHistory operation.
 */
export type ConversationsSendConversationHistoryResponse = ResourceResponse & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ResourceResponse;
  };
};

/**
 * Contains response data for the updateActivity operation.
 */
export type ConversationsUpdateActivityResponse = ResourceResponse & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ResourceResponse;
  };
};

/**
 * Contains response data for the replyToActivity operation.
 */
export type ConversationsReplyToActivityResponse = ResourceResponse & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ResourceResponse;
  };
};

/**
 * Contains response data for the getConversationMembers operation.
 */
export type ConversationsGetConversationMembersResponse = Array<ChannelAccount> & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ChannelAccount[];
  };
};

/**
 * Contains response data for the getConversationMember operation.
 */
export type ConversationsGetConversationMemberResponse = ChannelAccount & {
    /**
     * The underlying HTTP response.
     */
    _response: msRest.HttpResponse & {
      /**
       * The response body as text (string format)
       */
      bodyAsText: string;

      /**
       * The response body as parsed JSON or XML
       */
      parsedBody: ChannelAccount;
    };
  };

/**
 * Contains response data for the getConversationPagedMembers operation.
 */
export type ConversationsGetConversationPagedMembersResponse = PagedMembersResult & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: PagedMembersResult;
  };
};

/**
 * Contains response data for the getActivityMembers operation.
 */
export type ConversationsGetActivityMembersResponse = Array<ChannelAccount> & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ChannelAccount[];
  };
};

/**
 * Contains response data for the uploadAttachment operation.
 */
export type ConversationsUploadAttachmentResponse = ResourceResponse & {
  /**
   * The underlying HTTP response.
   */
  _response: msRest.HttpResponse & {
    /**
     * The response body as text (string format)
     */
    bodyAsText: string;

    /**
     * The response body as parsed JSON or XML
     */
    parsedBody: ResourceResponse;
  };
};
