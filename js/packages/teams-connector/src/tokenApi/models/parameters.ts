/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msRest from "@azure/ms-rest-js";

export const channelId0: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "channelId"
  ],
  mapper: {
    serializedName: "channelId",
    type: {
      name: "String"
    }
  }
};
export const channelId1: msRest.OperationQueryParameter = {
  parameterPath: "channelId",
  mapper: {
    required: true,
    serializedName: "channelId",
    type: {
      name: "String"
    }
  }
};
export const code: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "code"
  ],
  mapper: {
    serializedName: "code",
    type: {
      name: "String"
    }
  }
};
export const codeChallenge: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "codeChallenge"
  ],
  mapper: {
    serializedName: "code_challenge",
    type: {
      name: "String"
    }
  }
};
export const connectionName0: msRest.OperationQueryParameter = {
  parameterPath: "connectionName",
  mapper: {
    required: true,
    serializedName: "connectionName",
    type: {
      name: "String"
    }
  }
};
export const connectionName1: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "connectionName"
  ],
  mapper: {
    serializedName: "connectionName",
    type: {
      name: "String"
    }
  }
};
export const emulatorUrl: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "emulatorUrl"
  ],
  mapper: {
    serializedName: "emulatorUrl",
    type: {
      name: "String"
    }
  }
};
export const finalRedirect: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "finalRedirect"
  ],
  mapper: {
    serializedName: "finalRedirect",
    type: {
      name: "String"
    }
  }
};
export const include: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "include"
  ],
  mapper: {
    serializedName: "include",
    type: {
      name: "String"
    }
  }
};
export const state: msRest.OperationQueryParameter = {
  parameterPath: "state",
  mapper: {
    required: true,
    serializedName: "state",
    type: {
      name: "String"
    }
  }
};
export const userId: msRest.OperationQueryParameter = {
  parameterPath: "userId",
  mapper: {
    required: true,
    serializedName: "userId",
    type: {
      name: "String"
    }
  }
};
