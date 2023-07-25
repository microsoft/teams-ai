// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/identity";
import { AuthenticationResult, ConfidentialClientApplication, NodeAuthOptions } from "@azure/msal-node";
import {
  OnBehalfOfCredentialAuthConfig,
} from "./OnBehalfOfCredentialAuthConfig";
import jwt_decode from "jwt-decode";

/**
 * Represent on-behalf-of flow to get user identity, and it is designed to be used in server side.
 *
 * @example
 * ```typescript
 * const credential = new OnBehalfOfUserCredential(ssoToken);
 * ```
 *
 * @remarks
 * Can only be used in server side.
 */
export class OnBehalfOfUserCredential implements TokenCredential {
  private msalClient: ConfidentialClientApplication;
  private ssoToken: AccessToken;

  /**
   * Constructor of OnBehalfOfUserCredential
   *
   * @remarks
   * Only works in in server side.
   *
   * @param {string} ssoToken - User token provided by Teams SSO feature.
   * @param {OnBehalfOfCredentialAuthConfig} config - The authentication configuration.
   *
   * @throws {@link ErrorCode|InvalidConfiguration} when client id, client secret, certificate content, authority host or tenant id is not found in config.
   * @throws {@link ErrorCode|InternalError} when SSO token is not valid.
   * @throws {@link ErrorCode|RuntimeNotSupported} when runtime is browser.
   */
  constructor(ssoToken: string, config: OnBehalfOfCredentialAuthConfig);
  /**
   * Constructor of OnBehalfOfUserCredential
   *
   * @remarks
   * Only works in in server side.
   *
   * @param {string} ssoToken - User token provided by Teams SSO feature.
   * @param {AuthenticationConfiguration} config - The authentication configuration. Use environment variables if not provided.
   *
   * @throws {@link ErrorCode|InvalidConfiguration} when client id, client secret, certificate content, authority host or tenant id is not found in config.
   * @throws {@link ErrorCode|InternalError} when SSO token is not valid.
   * @throws {@link ErrorCode|RuntimeNotSupported} when runtime is browser.
   */
  constructor(
    ssoToken: string,
    config: OnBehalfOfCredentialAuthConfig
  ) {
    const missingConfigurations: string[] = [];
    if (!config.clientId) {
      missingConfigurations.push("clientId");
    }

    if (!config.authorityHost) {
      missingConfigurations.push("authorityHost");
    }

    if (!config.clientSecret && !config.certificateContent) {
      missingConfigurations.push("clientSecret or certificateContent");
    }

    if (!config.tenantId) {
      missingConfigurations.push("tenantId");
    }

    if (missingConfigurations.length != 0) {
      const errorMsg = `invalid configuration: ${missingConfigurations.join(", ")}`;
      throw new Error(errorMsg);
    }

    this.msalClient = this.createConfidentialClientApplication(config);

    const decodedSsoToken = this.parseJwt(ssoToken);
    this.ssoToken = {
      token: ssoToken,
      expiresOnTimestamp: decodedSsoToken.exp,
    };
  }

  /**
   * Get access token from credential.
   *
   * @example
   * ```typescript
   * await credential.getToken([]) // Get SSO token using empty string array
   * await credential.getToken("") // Get SSO token using empty string
   * await credential.getToken([".default"]) // Get Graph access token with default scope using string array
   * await credential.getToken(".default") // Get Graph access token with default scope using string
   * await credential.getToken(["User.Read"]) // Get Graph access token for single scope using string array
   * await credential.getToken("User.Read") // Get Graph access token for single scope using string
   * await credential.getToken(["User.Read", "Application.Read.All"]) // Get Graph access token for multiple scopes using string array
   * await credential.getToken("User.Read Application.Read.All") // Get Graph access token for multiple scopes using space-separated string
   * await credential.getToken("https://graph.microsoft.com/User.Read") // Get Graph access token with full resource URI
   * await credential.getToken(["https://outlook.office.com/Mail.Read"]) // Get Outlook access token
   * ```
   *
   * @param {string | string[]} scopes - The list of scopes for which the token will have access.
   * @param {GetTokenOptions} options - The options used to configure any requests this TokenCredential implementation might make.
   *
   * @throws {@link ErrorCode|InternalError} when failed to acquire access token on behalf of user with unknown error.
   * @throws {@link ErrorCode|TokenExpiredError} when SSO token has already expired.
   * @throws {@link ErrorCode|UiRequiredError} when need user consent to get access token.
   * @throws {@link ErrorCode|ServiceError} when failed to get access token from simple auth server.
   * @throws {@link ErrorCode|InvalidParameter} when scopes is not a valid string or string array.
   * @throws {@link ErrorCode|RuntimeNotSupported} when runtime is browser.
   *
   * @returns Access token with expected scopes.
   *
   * @remarks
   * If scopes is empty string or array, it returns SSO token.
   * If scopes is non-empty, it returns access token for target scope.
   */
  async getToken(
    scopes: string | string[],
    options?: GetTokenOptions
  ): Promise<AccessToken | null> {
    this.validateScopesType(scopes);

    const scopesArray = this.getScopesArray(scopes);

    let result: AccessToken | null;
    if (!scopesArray.length) {
      if (Math.floor(Date.now() / 1000) > this.ssoToken.expiresOnTimestamp) {
        const errorMsg = "Sso token has already expired.";
        throw new Error(errorMsg);
      }
      result = this.ssoToken;
    } else {
      let authenticationResult: AuthenticationResult | null;
      try {
        authenticationResult = await this.msalClient.acquireTokenOnBehalfOf({
          oboAssertion: this.ssoToken.token,
          scopes: scopesArray,
        });
      } catch (error) {
        throw this.generateAuthServerError(error);
      }

      if (!authenticationResult) {
        const errorMsg = "Access token is null";
        throw new Error(
          `failed to acquire token on behalf of user: ${errorMsg}`,
        );
      }

      result = {
        token: authenticationResult.accessToken,
        expiresOnTimestamp: authenticationResult.expiresOn!.getTime(),
      };
    }

    return result;
  }

  private generateAuthServerError(err: any): Error {
    const errorMessage = err.errorMessage;
    if (err.name === "InteractionRequiredAuthError") {
      const fullErrorMsg =
        "Failed to get access token from AAD server, interaction required: " + errorMessage;
      return new Error(fullErrorMsg);
    } else if (errorMessage && errorMessage.indexOf("AADSTS50013") >= 0) {
      const fullErrorMsg =
        "Failed to get access token from AAD server, assertion is invalid because of various reasons: " +
        errorMessage;
      return new Error(fullErrorMsg);
    } else {
      const fullErrorMsg = `failed to acquire token on behalf of user: ${errorMessage}`;
      return new Error(fullErrorMsg);
    }
  }

  private createConfidentialClientApplication(
    authentication: OnBehalfOfCredentialAuthConfig
  ): ConfidentialClientApplication {
    const authority = this.getAuthority(authentication.authorityHost!, authentication.tenantId!);
  
    const auth: NodeAuthOptions = {
      clientId: authentication.clientId!,
      authority: authority,
    };
  
    auth.clientSecret = authentication.clientSecret;
    return new ConfidentialClientApplication({
      auth,
    });
  }

  private getAuthority(authorityHost: string, tenantId: string): string {
    const normalizedAuthorityHost = authorityHost.replace(/\/+$/g, "");
    return normalizedAuthorityHost + "/" + tenantId;
  }

  private parseJwt(token: string): any {
    try {
      const tokenObj = jwt_decode(token) as any;
      if (!tokenObj || !tokenObj.exp) {
        throw new Error(
          "Decoded token is null or exp claim does not exists."
        );
      }
  
      return tokenObj;
    } catch (err: any) {
      const errorMsg = "Parse jwt token failed in node env with error: " + err.message;
      throw new Error(errorMsg);
    }
  }

  private validateScopesType(value: any): void {
    // string
    if (typeof value === "string" || value instanceof String) {
      return;
    }
  
    // empty array
    if (Array.isArray(value) && value.length === 0) {
      return;
    }
  
    // string array
    if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string")) {
      return;
    }
  
    const errorMsg = "The type of scopes is not valid, it must be string or string array";
    throw new Error(errorMsg);
  }

  private getScopesArray(scopes: string | string[]): string[] {
    const scopesArray: string[] = typeof scopes === "string" ? scopes.split(" ") : scopes;
    return scopesArray.filter((x) => x !== null && x !== "");
  }
}
