const assert = require('assert');
const { AuthenticationError } = require('../..');
const { StatusCodes } = require('botframework-schema');

describe('AuthenticationError', function () {
    it('should implement IStatusCodeError if it is an AuthenticationError', function () {
        const authError = new AuthenticationError('I am an error', 500);
        const isStatusCodeErr = AuthenticationError.isStatusCodeError(authError);

        assert.strictEqual(authError.statusCode, StatusCodes.INTERNAL_SERVER_ERROR);
        assert.strictEqual(isStatusCodeErr, true);
    });

    it('should return false if it is not an error that implements IStatusCodeError', function () {
        const nonStatusCodeError = new Error("I'm just a vanilla Error");
        const isStatusCodeErr = AuthenticationError.isStatusCodeError(nonStatusCodeError);

        assert.strictEqual(isStatusCodeErr, false);
    });

    it('should be able to assign a 400 statusCode if none was provided and build correct error message', function () {
        const errMessage = "'authHeader' is required.";
        const code = StatusCodes.BAD_REQUEST;
        const expectedMessage = `HTTP/1.1 ${code} ${StatusCodes[code]}\r\n${errMessage}\r\nConnection: 'close'\r\n\r\n`;

        const nonStatusCodeError = new Error(errMessage);
        const actualMessage = AuthenticationError.determineStatusCodeAndBuildMessage(nonStatusCodeError);

        assert.strictEqual(actualMessage, expectedMessage);
    });

    it('should be able to assign a 401 statusCode if none was provided and build correct error message', function () {
        const errMessage = 'Unauthorized. Is not authenticated';
        const code = StatusCodes.UNAUTHORIZED;
        const expectedMessage = `HTTP/1.1 ${code} ${StatusCodes[code]}\r\n${errMessage}\r\nConnection: 'close'\r\n\r\n`;

        const nonStatusCodeError = new Error(errMessage);
        const actualMessage = AuthenticationError.determineStatusCodeAndBuildMessage(nonStatusCodeError);

        assert.strictEqual(actualMessage, expectedMessage);
    });

    it('should be able to assign a 500 statusCode if none was provided and build correct error message', function () {
        const errMessage = 'Oops!';
        const code = StatusCodes.INTERNAL_SERVER_ERROR;
        const expectedMessage = `HTTP/1.1 ${code} ${StatusCodes[code]}\r\n${errMessage}\r\nConnection: 'close'\r\n\r\n`;

        const nonStatusCodeError = new Error(errMessage);
        const actualMessage = AuthenticationError.determineStatusCodeAndBuildMessage(nonStatusCodeError);

        assert.strictEqual(actualMessage, expectedMessage);
    });
});
