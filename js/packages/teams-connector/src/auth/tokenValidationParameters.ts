// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { VerifyOptions } from 'jsonwebtoken';

// Internal
/**
 * Default options for validating incoming tokens from the Bot Framework Emulator and Skills.
 */
export const ToBotFromBotOrEmulatorTokenValidationParameters: VerifyOptions = {
    issuer: [
        'https://sts.windows.net/d6d49420-f39b-4df7-a1dc-d59a935871db/', // Auth v3.1, 1.0 token
        'https://login.microsoftonline.com/d6d49420-f39b-4df7-a1dc-d59a935871db/v2.0', // Auth v3.1, 2.0 token
        'https://sts.windows.net/f8cdef31-a31e-4b4a-93e4-5f571e91255a/', // Auth v3.2, 1.0 token
        'https://login.microsoftonline.com/f8cdef31-a31e-4b4a-93e4-5f571e91255a/v2.0', // Auth v3.2, 2.0 token
        'https://sts.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/', // ???
        'https://sts.windows.net/cab8a31a-1906-4287-a0d8-4eef66b95f6e/', // US Gov Auth, 1.0 token
        'https://login.microsoftonline.us/cab8a31a-1906-4287-a0d8-4eef66b95f6e/v2.0', // US Gov Auth, 2.0 token
        'https://login.microsoftonline.us/f8cdef31-a31e-4b4a-93e4-5f571e91255a/', // Auth for US Gov, 1.0 token
        'https://login.microsoftonline.us/f8cdef31-a31e-4b4a-93e4-5f571e91255a/v2.0', // Auth for US Gov, 2.0 token
    ],
    audience: undefined, // Audience validation takes place manually in code.
    clockTolerance: 5 * 60,
    ignoreExpiration: false,
};
