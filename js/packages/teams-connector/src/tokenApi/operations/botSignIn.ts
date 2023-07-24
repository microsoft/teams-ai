/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msRest from "@azure/ms-rest-js";
import * as Models from "../models";
import * as Mappers from "../models/botSignInMappers";
import * as Parameters from "../models/parameters";
import { TokenApiClientContext } from "../tokenApiClientContext";
import { SignInUrlResponse } from "botframework-schema";

/** Class representing a BotSignIn. */
export class BotSignIn {
  private readonly client: TokenApiClientContext;

  /**
   * Create a BotSignIn.
   * @param {TokenApiClientContext} client Reference to the service client.
   */
  constructor(client: TokenApiClientContext) {
    this.client = client;
  }

  /**
   * @param state
   * @param [options] The optional parameters
   * @returns Promise<Models.BotSignInGetSignInUrlResponse>
   */
  getSignInUrl(state: string, options?: Models.BotSignInGetSignInUrlOptionalParams): Promise<Models.BotSignInGetSignInUrlResponse>;
  /**
   * @param state
   * @param callback The callback
   */
  getSignInUrl(state: string, callback: msRest.ServiceCallback<string>): void;
  /**
   * @param state
   * @param options The optional parameters
   * @param callback The callback
   */
  getSignInUrl(state: string, options: Models.BotSignInGetSignInUrlOptionalParams, callback: msRest.ServiceCallback<string>): void;
  getSignInUrl(state: string, options?: Models.BotSignInGetSignInUrlOptionalParams | msRest.ServiceCallback<string>, callback?: msRest.ServiceCallback<string>): Promise<Models.BotSignInGetSignInUrlResponse> {
    return this.client.sendOperationRequest(
      {
        state,
        options
      },
      getSignInUrlOperationSpec,
      callback) as Promise<Models.BotSignInGetSignInUrlResponse>;
  }

  /**
   * @param state
   * @param [options] The optional parameters
   * @returns Promise<Models.BotSignInGetSignInResourceResponse>
   */
  getSignInResource(state: string, options?: Models.BotSignInGetSignInResourceOptionalParams): Promise<Models.BotSignInGetSignInResourceResponse>;
  /**
   * @param state
   * @param callback The callback
   */
  getSignInResource(state: string, callback: msRest.ServiceCallback<SignInUrlResponse>): void;
  /**
   * @param state
   * @param options The optional parameters
   * @param callback The callback
   */
  getSignInResource(state: string, options: Models.BotSignInGetSignInResourceOptionalParams, callback: msRest.ServiceCallback<SignInUrlResponse>): void;
  getSignInResource(state: string, options?: Models.BotSignInGetSignInResourceOptionalParams | msRest.ServiceCallback<SignInUrlResponse>, callback?: msRest.ServiceCallback<SignInUrlResponse>): Promise<Models.BotSignInGetSignInResourceResponse> {
    return this.client.sendOperationRequest(
      {
        state,
        options
      },
      getSignInResourceOperationSpec,
      callback) as Promise<Models.BotSignInGetSignInResourceResponse>;
  }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers);
const getSignInUrlOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "api/botsignin/GetSignInUrl",
  queryParameters: [
    Parameters.state,
    Parameters.codeChallenge,
    Parameters.emulatorUrl,
    Parameters.finalRedirect
  ],
  responses: {
    200: {
      bodyMapper: {
        serializedName: "parsedResponse",
        type: {
          name: "String"
        }
      }
    },
    default: {}
  },
  serializer
};

const getSignInResourceOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "api/botsignin/GetSignInResource",
  queryParameters: [
    Parameters.state,
    Parameters.codeChallenge,
    Parameters.emulatorUrl,
    Parameters.finalRedirect
  ],
  responses: {
    200: {
      bodyMapper: Mappers.SignInUrlResponse
    },
    default: {}
  },
  serializer
};
