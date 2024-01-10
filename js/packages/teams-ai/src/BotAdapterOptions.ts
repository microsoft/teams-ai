import { TeamsBotFrameworkAuthentication } from './TeamsBotFrameworkAuthentication';

export interface BotAdapterOptions {
    appId?: string;
    authentication?: TeamsBotFrameworkAuthentication;
}
