const fs = require('fs-extra');
const path = require('path');

const nockBack = require('nock').back;

/**
 * https://github.com/nock/nock#modes
 * Setting environment:
 *     PowerShell: $env:MOCK_MODE="<desiredMode>"
 *     Command Prompt: set MOCK_MODE=<desiredMode>
 *     VS Code's launch.json: "env": { "MOCK_MODE": "<desiredMode>" },
 */
const MockMode = Object.freeze({
    wild: 'wild',
    dryrun: 'dryrun',
    record: 'record',
    lockdown: 'lockdown',
});

function usingNock(test, mode, options = null) {
    const testDirectory = getMockDirectory(test);
    const testFile = getFormatedNockFileName(test);

    nockBack.setMode(mode);
    nockBack.fixtures = testDirectory;

    let fixedScope = null;

    if (options && options.scope) {
        fixedScope = options.scope;
    }

    /**
     * Test recordings fail when testing waterfall dialogs because the SDK sets a random instanceId GUID
     * and it's included in the request body. The next two functions replace that instanceId with a constant
     * so that tests using waterfall dialogs can pass when using the nock recordings
     */
    const instanceIdRegEx = /"instanceId":"[\w-]{36}"/g;
    const instanceIdReplacement = 'fakeInstanceId';

    const replaceCalledInstanceId = function (scope) {
        scope.filteringRequestBody = (body) => {
            return body.replace(instanceIdRegEx, `"instanceId":"${instanceIdReplacement}"`);
        };
    };

    const replaceRecordedInstanceId = function (requests) {
        requests.map((req) => {
            if (
                req.body &&
                req.body.document &&
                req.body.document.dialogState &&
                req.body.document.dialogState.dialogStack
            ) {
                req.body.document.dialogState.dialogStack.forEach((stack) => {
                    if (stack.state && stack.state.values && stack.state.values.instanceId) {
                        stack.state.values.instanceId = instanceIdReplacement;
                    }
                });
            }
            return req;
        });

        return requests;
    };

    const setFixedScope = function (requests) {
        if (fixedScope) {
            requests = requests.map((req) => {
                req.scope = fixedScope;
                return req;
            });
        }

        requests = replaceRecordedInstanceId(requests);

        return requests;
    };

    const nockBackOptions = {
        before: replaceCalledInstanceId,
        afterRecord: setFixedScope,
        recorder: {
            output_objects: true,
            dont_print: true,
            enable_reqheaders_recording: false,
            use_separator: false,
        },
    };

    if (mode === MockMode.record) {
        fs.removeSync(path.join(testDirectory, testFile));
    }

    return nockBack(testFile, nockBackOptions);
}

function getMockDirectory(test) {
    if (test && test.title && test.parent) {
        return path.join(__dirname, 'TestData', test.parent.title);
    } else {
        throw new Error("No 'test' object has been provided.");
    }
}

function getFormatedNockFileName(test) {
    return `${test.title.replace(/ /g, '_')}.json`;
}

module.exports = {
    MockMode: MockMode,
    usingNock: usingNock,
};
