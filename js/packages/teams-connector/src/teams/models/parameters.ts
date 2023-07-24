/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msRest from '@azure/ms-rest-js';

export const teamId: msRest.OperationURLParameter = {
    parameterPath: 'teamId',
    mapper: {
        required: true,
        serializedName: 'teamId',
        type: {
            name: 'String',
        },
    },
};

export const meetingId: msRest.OperationURLParameter = {
    parameterPath: 'meetingId',
    mapper: {
        required: true,
        serializedName: 'meetingId',
        type: {
            name: 'String',
        },
    },
};

export const participantId: msRest.OperationURLParameter = {
    parameterPath: 'participantId',
    mapper: {
        required: true,
        serializedName: 'participantId',
        type: {
            name: 'String',
        },
    },
};

export const tenantId: msRest.OperationQueryParameter = {
    parameterPath: ['options', 'tenantId'],
    mapper: {
        serializedName: 'tenantId',
        type: {
            name: 'String',
        },
    },
};
