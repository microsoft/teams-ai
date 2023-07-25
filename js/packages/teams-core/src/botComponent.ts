// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';
import { Configuration, ServiceCollection } from 'botbuilder-dialogs-adaptive-runtime-core';

/**
 * Definition of a BotComponent that allows registration of services, custom actions, memory scopes and adapters.
 *
 * To make your components available to the system you derive from BotComponent and register services to add functionality.
 * These components then are consumed in appropriate places by the systems that need them. When using Composer, configureServices
 * gets called automatically on the components by the bot runtime, as long as the components are registered in the configuration.
 */
export abstract class BotComponent {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static z = z.custom<BotComponent>((val: any) => typeof val.configureServices === 'function', {
        message: 'BotComponent',
    });

    abstract configureServices(services: ServiceCollection, configuration: Configuration): void;
}

/**
 * @internal
 *
 * @deprecated Use `BotComponent.z.parse()` instead.
 */
export function assertBotComponent(val: unknown, ..._args: unknown[]): asserts val is BotComponent {
    BotComponent.z.parse(val);
}
