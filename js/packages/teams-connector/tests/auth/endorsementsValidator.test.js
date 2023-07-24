// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require('assert');
const { EndorsementsValidator } = require('../..');

describe('EndorsementsValidator', function () {
    it('with null channelId should pass', function () {
        assert(EndorsementsValidator.validate(null, []));
    });

    it('with null endorsements should throw', function () {
        assert.throws(() => EndorsementsValidator.validate('foo', null));
    });

    it('with unendorsed channelId should fail', function () {
        assert(!EndorsementsValidator.validate('channelOne', []));
    });

    it('with mismatched endorsements should fail', function () {
        assert(!EndorsementsValidator.validate('right', ['wrong']));
    });

    it('with endorsed channelId should pass', function () {
        assert(EndorsementsValidator.validate('right', ['right']));
    });

    it('with endorsed channelId and many endorsements should pass', function () {
        assert(EndorsementsValidator.validate('right', ['wrong', 'right']));
    });

    it('with empty channelId should pass', function () {
        assert(EndorsementsValidator.validate('', ['wrong', 'right']));
    });
});
