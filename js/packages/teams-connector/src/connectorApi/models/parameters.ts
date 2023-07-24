/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msRest from "@azure/ms-rest-js";

export const activityId: msRest.OperationURLParameter = {
  parameterPath: "activityId",
  mapper: {
    required: true,
    serializedName: "activityId",
    type: {
      name: "String"
    }
  }
};
export const attachmentId: msRest.OperationURLParameter = {
  parameterPath: "attachmentId",
  mapper: {
    required: true,
    serializedName: "attachmentId",
    type: {
      name: "String"
    }
  }
};
export const continuationToken: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "continuationToken"
  ],
  mapper: {
    serializedName: "continuationToken",
    type: {
      name: "String"
    }
  }
};
export const conversationId: msRest.OperationURLParameter = {
  parameterPath: "conversationId",
  mapper: {
    required: true,
    serializedName: "conversationId",
    type: {
      name: "String"
    }
  }
};
export const memberId: msRest.OperationURLParameter = {
  parameterPath: "memberId",
  mapper: {
    required: true,
    serializedName: "memberId",
    type: {
      name: "String"
    }
  }
};
export const pageSize: msRest.OperationQueryParameter = {
  parameterPath: [
    "options",
    "pageSize"
  ],
  mapper: {
    serializedName: "pageSize",
    type: {
      name: "Number"
    }
  }
};
export const viewId: msRest.OperationURLParameter = {
  parameterPath: "viewId",
  mapper: {
    required: true,
    serializedName: "viewId",
    type: {
      name: "String"
    }
  }
};
