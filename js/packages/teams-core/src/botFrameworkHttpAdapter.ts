// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { INodeBuffer, INodeSocket } from 'botframework-streaming';
import type { Request, Response } from './interfaces';
import { TurnContext } from './turnContext';

/**
 * @deprecated Use `CloudAdapter` instead.
 * BotFrameworkHttpAdapter is the interface that describes a Bot Framework
 * adapter that operates on HTTP requests.
 */
export interface BotFrameworkHttpAdapter {
    /**
     * Process a web request by applying a logic callback function.
     */
    process(req: Request, res: Response, logic: (context: TurnContext) => Promise<void>): Promise<void>;

    /**
     * Handle a web socket connection by applying a logic callback function to
     * each streaming request.
     */
    process(
        req: Request,
        socket: INodeSocket,
        head: INodeBuffer,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>;
}
