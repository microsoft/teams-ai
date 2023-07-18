import { OnBehalfOfCredentialAuthConfig } from "./OnBehalfOfCredentialAuthConfig";

export interface SsoPromptSettings {
  scopes: string[];
  timeout?: number;
  endOnInvalidMessage?: boolean;
  appCredentials: OnBehalfOfCredentialAuthConfig;
  initialLoginEndpoint: string;
}