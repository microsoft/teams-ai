export interface ISettings {
    clientId: string;
    tenantId: string;
    clientSecret: string;
    scopes: string[];
}

export const settings: ISettings = {
    clientId: '',
    tenantId: '',
    clientSecret: '', // value from Azure AD
    scopes: ['https://graph.microsoft.com/.default']
};

export default settings;
