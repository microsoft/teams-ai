// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as z from 'zod';
import { ok } from 'assert';
import {
    JwtTokenProviderFactory,
    ManagedIdentityServiceClientCredentialsFactory,
    PasswordServiceClientCredentialFactory,
    ServiceClientCredentials,
    ServiceClientCredentialsFactory,
} from '@microsoft/teams-connector';

const MultiTenant = 'MultiTenant';
const SingleTenant = 'SingleTenant';
const UserAssignedMsi = 'UserAssignedMsi';

const TypedConfig = z
    .object({
        /**
         * The ID assigned to your bot in the [Bot Framework Portal](https://dev.botframework.com/).
         */
        MicrosoftAppId: z.string(),

        /**
         * The password assigned to your bot in the [Bot Framework Portal](https://dev.botframework.com/).
         */
        MicrosoftAppPassword: z.string(),

        /**
         * The type of app id assigned to your bot in the [Bot Framework Portal](https://dev.botframework.com/).
         */
        MicrosoftAppType: z.string(),

        /**
         * The tenant id assigned to your bot in the [Bot Framework Portal](https://dev.botframework.com/).
         */
        MicrosoftAppTenantId: z.string(),
    })
    .partial();

/**
 * Contains settings used to configure a [ConfigurationServiceClientCredentialFactory](xref:botbuilder-core.ConfigurationServiceClientCredentialFactory) instance.
 */
export type ConfigurationServiceClientCredentialFactoryOptions = z.infer<typeof TypedConfig>;

/**
 * ServiceClientCredentialsFactory that uses a [ConfigurationServiceClientCredentialFactoryOptions](xref:botbuilder-core.ConfigurationServiceClientCredentialFactoryOptions) or a [Configuration](xref:botbuilder-dialogs-adaptive-runtime-core.Configuration) instance to build ServiceClientCredentials with an AppId and App Password.
 */
export class ConfigurationServiceClientCredentialFactory extends PasswordServiceClientCredentialFactory {
    private readonly inner: ServiceClientCredentialsFactory;

    /**
     * Initializes a new instance of the [ConfigurationServiceClientCredentialFactory](xref:botbuilder-core.ConfigurationServiceClientCredentialFactory) class.
     *
     * @param factoryOptions A [ConfigurationServiceClientCredentialFactoryOptions](xref:botbuilder-core.ConfigurationServiceClientCredentialFactoryOptions) object.
     */
    constructor(factoryOptions: ConfigurationServiceClientCredentialFactoryOptions = {}) {
        const {
            MicrosoftAppId = null,
            MicrosoftAppPassword = null,
            MicrosoftAppType = null,
            MicrosoftAppTenantId = null,
        } = TypedConfig.nonstrict().parse(factoryOptions);
        super(MicrosoftAppId!, MicrosoftAppPassword!, MicrosoftAppTenantId!);

        const appType = MicrosoftAppType?.trim() ?? MultiTenant;

        switch (appType.toLocaleLowerCase()) {
            case UserAssignedMsi.toLocaleLowerCase():
                ok(MicrosoftAppId?.trim(), 'MicrosoftAppId is required for MSI in configuration.');
                ok(MicrosoftAppTenantId?.trim(), 'MicrosoftAppTenantId is required for MSI in configuration.');
                ok(!MicrosoftAppPassword?.trim(), 'MicrosoftAppPassword must not be set for MSI in configuration.');

                this.inner = new ManagedIdentityServiceClientCredentialsFactory(
                    MicrosoftAppId!,
                    new JwtTokenProviderFactory()
                );
                break;
            case SingleTenant.toLocaleLowerCase():
                ok(MicrosoftAppId?.trim(), 'MicrosoftAppId is required for SingleTenant in configuration.');
                ok(MicrosoftAppPassword?.trim(), 'MicrosoftAppPassword is required for SingleTenant in configuration.');
                ok(MicrosoftAppTenantId?.trim(), 'MicrosoftAppTenantId is required for SingleTenant in configuration.');

                this.inner = new PasswordServiceClientCredentialFactory(
                    MicrosoftAppId!,
                    MicrosoftAppPassword!,
                    MicrosoftAppTenantId!
                );
                break;
            default:
                //MultiTenant
                this.inner = new PasswordServiceClientCredentialFactory(MicrosoftAppId!, MicrosoftAppPassword!, '');
                break;
        }
    }

    /**
     * @inheritdoc
     */
    isValidAppId(microsoftAppId: string): Promise<boolean> {
        return this.inner.isValidAppId(microsoftAppId);
    }

    /**
     * @inheritdoc
     */
    isAuthenticationDisabled(): Promise<boolean> {
        return this.inner.isAuthenticationDisabled();
    }

    /**
     * @inheritdoc
     */
    createCredentials(
        microsoftAppId: string,
        audience: string,
        loginEndpoint: string,
        validateAuthority: boolean
    ): Promise<ServiceClientCredentials> {
        return this.inner.createCredentials(microsoftAppId, audience, loginEndpoint, validateAuthority);
    }
}
