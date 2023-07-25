// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';
import { INodeBuffer, INodeSocket } from 'botframework-streaming';
import { TurnContext } from './turnContext';

export const INodeBufferT = z.custom<INodeBuffer>(Buffer.isBuffer, { message: 'INodeBufferT' });

export const INodeSocketT = z.custom<INodeSocket>(
    (val: any) =>
        typeof val.emit === 'function' &&
        typeof val.end === 'function' &&
        typeof val.off === 'function' &&
        typeof val.on === 'function' &&
        typeof val.once === 'function' &&
        typeof val.pipe === 'function' &&
        typeof val.write === 'function',
    { message: 'INodeSocket' }
);

export const LogicT = z.custom<(context: TurnContext) => Promise<void>>((val) => typeof val === 'function');
