import { strict as assert } from 'assert';
import { PasswordServiceClientCredentialFactory } from 'botframework-connector';

import packageInfo from '../package.json';
import { TeamsBotFrameworkAuthentication } from './TeamsBotFrameworkAuthentication';

const USER_AGENT = `${packageInfo.name}/${packageInfo.version}`;

describe('TeamsBotFrameworkAuthentication', () => {
    const auth = new TeamsBotFrameworkAuthentication({
        credentialsFactory: new PasswordServiceClientCredentialFactory('', '')
    });

    it('should have custom `User-Agent`', () => {
        assert.equal(auth.connectedClientOptions.userAgent, USER_AGENT);
        assert.equal(auth.connectedClientOptions.userAgentHeaderName, undefined);
    });
});
