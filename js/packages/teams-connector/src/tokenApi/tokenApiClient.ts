/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msRest from "@azure/ms-rest-js";
import * as Models from "./models";
import * as Mappers from "./models/mappers";
import * as operations from "./operations";
import { TokenApiClientContext } from "./tokenApiClientContext";

class TokenApiClient extends TokenApiClientContext {
  // Operation groups
  botSignIn: operations.BotSignIn;
  userToken: operations.UserToken;

  /**
   * Initializes a new instance of the TokenApiClient class.
   * @param credentials Subscription credentials which uniquely identify client subscription.
   * @param [options] The parameter options
   */
  constructor(credentials: msRest.ServiceClientCredentials, options?: Models.TokenApiClientOptions) {
    super(credentials, options);
    this.botSignIn = new operations.BotSignIn(this);
    this.userToken = new operations.UserToken(this);
  }
}

// Operation Specifications

export {
  TokenApiClient,
  TokenApiClientContext,
  Models as TokenApiModels,
  Mappers as TokenApiMappers
};
export * from "./operations";
