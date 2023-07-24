const assert = require('assert');
const { UserTokenClient } = require('../..');

describe('UserTokenClient', function () {
    describe('createTokenExchangeState', function () {
        const paramsValidation = [
            { paramName: 'appId', values: [null, 'connectionName', {}] },
            { paramName: 'connectionName', values: ['appId', null, {}] },
            { paramName: 'activity', values: ['appId', 'connectionName', null] },
        ];

        paramsValidation.forEach(({ paramName, values }) => {
            it(`should throw with null ${paramName}`, function () {
                assert.throws(
                    () => UserTokenClient.createTokenExchangeState(...values),
                    (thrown) => thrown.message.includes(paramName) && thrown.message.includes('received null')
                );
            });
        });
    });
});
