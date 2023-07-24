/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServiceClientOptions } from "@azure/ms-rest-js";
import * as msRest from "@azure/ms-rest-js";
import { SignInUrlResponse, TokenResponse, TokenStatus } from "botframework-schema";

/**
 * @interface
 * An interface representing InnerHttpError.
 */
export interface InnerHttpError {
  /**
   * @member {number} [statusCode]
   */
  statusCode?: number;
  /**
   * @member {any} [body]
   */
  body?: any;
}

/**
 * @interface
 * An interface representing ErrorModel.
 */
export interface ErrorModel {
  /**
   * @member {string} [code]
   */
  code?: string;
  /**
   * @member {string} [message]
   */
  message?: string;
  /**
   * @member {InnerHttpError} [innerHttpError]
   */
  innerHttpError?: InnerHttpError;
}

/**
 * @interface
 * An interface representing ErrorResponse.
 */
export interface ErrorResponse {
  /**
   * @member {ErrorModel} [error]
   */
  error?: ErrorModel;
}

/**
 * @interface
 * An interface representing AadResourceUrls.
 */
export interface AadResourceUrls {
  /**
   * @member {string[]} [resourceUrls]
   */
  resourceUrls?: string[];
}

/**
 * @interface
 * An interface representing TokenApiClientOptions.
 * @extends ServiceClientOptions
 */
export interface TokenApiClientOptions extends ServiceClientOptions {
  /**
   * @member {string} [baseUri]
   */
  baseUri?: string;
}

/**
 * @interface
 * An interface representing BotSignInGetSignInUrlOptionalParams.
 * Optional Parameters.
 *
 * @extends RequestOptionsBase
 */
export interface BotSignInGetSignInUrlOptionalParams extends msRest.RequestOptionsBase {
  /**
   * @member {string} [codeChallenge]
   */
  codeChallenge?: string;
  /**
   * @member {string} [emulatorUrl]
   */
  emulatorUrl?: string;
  /**
   * @member {string} [finalRedirect]
   */
  finalRedirect?: string;
}

/**
 * @interface
 * An interface representing BotSignInGetSignInResourceOptionalParams.
 * Optional Parameters.
 *
 * @extends RequestOptionsBase
 */
export interface BotSignInGetSignInResourceOptionalParams extends msRest.RequestOptionsBase {
  /**
   * @member {string} [codeChallenge]
   */
  codeChallenge?: string;
  /**
   * @member {string} [emulatorUrl]
   */
  emulatorUrl?: string;
  /**
   * @member {string} [finalRedirect]
   */
  finalRedirect?: string;
}

/**
 * @interface
 * An interface representing UserTokenGetTokenOptionalParams.
 * Optional Parameters.
 *
 * @extends RequestOptionsBase
 */
export interface UserTokenGetTokenOptionalParams extends msRest.RequestOptionsBase {
  /**
   * @member {string} [channelId]
   */
  channelId?: string;
  /**
   * @member {string} [code]
   */
  code?: string;
}

/**
 * @interface
 * An interface representing UserTokenGetAadTokensOptionalParams.
 * Optional Parameters.
 *
 * @extends RequestOptionsBase
 */
export interface UserTokenGetAadTokensOptionalParams extends msRest.RequestOptionsBase {
  /**
   * @member {string} [channelId]
   */
  channelId?: string;
}

/**
 * @interface
 * An interface representing UserTokenSignOutOptionalParams.
 * Optional Parameters.
 *
 * @extends RequestOptionsBase
 */
export interface UserTokenSignOutOptionalParams extends msRest.RequestOptionsBase {
  /**
   * @member {string} [connectionName]
   */
  connectionName?: string;
  /**
   * @member {string} [channelId]
   */
  channelId?: string;
}

/**
 * @interface
 * An interface representing UserTokenGetTokenStatusOptionalParams.
 * Optional Parameters.
 *
 * @extends RequestOptionsBase
 */
export interface UserTokenGetTokenStatusOptionalParams extends msRest.RequestOptionsBase {
  /**
   * @member {string} [channelId]
   */
  channelId?: string;
  /**
   * @member {string} [include]
   */
  include?: string;
}

/**
 * Contains response data for the getSignInUrl operation.
 */
export type BotSignInGetSignInUrlResponse = {
  /**
   * The parsed response body.
   */
  body: string;
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
      parsedBody: string;
    };
};

/**
 * Contains response data for the getSignInResource operation.
 */
export type BotSignInGetSignInResourceResponse = SignInUrlResponse & {
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
      parsedBody: SignInUrlResponse;
    };
};

/**
 * Contains response data for the getToken operation.
 */
export type UserTokenGetTokenResponse = TokenResponse & {
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
      parsedBody: TokenResponse;
    };
};

/**
 * Contains response data for the getAadTokens operation.
 */
export type UserTokenGetAadTokensResponse = {
  /**
   * The response body properties.
   */
  [propertyName: string]: TokenResponse;
} & {
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
      parsedBody: { [propertyName: string]: TokenResponse };
    };
};

/**
 * Contains response data for the signOut operation.
 */
export type UserTokenSignOutResponse = {
  /**
   * The parsed response body.
   */
  body: any;
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
      parsedBody: any;
    };
};

/**
 * Contains response data for the getTokenStatus operation.
 */
export type UserTokenGetTokenStatusResponse = Array<TokenStatus> & {
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
      parsedBody: TokenStatus[];
    };
};

/**
 * Contains response data for the exchangeAsync operation.
 */
export type UserTokenExchangeAsyncResponse = {
  /**
   * The parsed response body.
   */
  body: any;
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
      parsedBody: any;
    };
};
