const assert = require('assert');

const {
    AliasPathResolver,
    AtAtPathResolver,
    AtPathResolver,
    DollarPathResolver,
    HashPathResolver,
    PercentPathResolver,
} = require('../..');

describe('Path Resolvers', function () {
    it('AliasPathResolver should should prefix paths.', function () {
        const resolver = new AliasPathResolver('@', 'turn.recognized.entities.');
        const path = resolver.transformPath('@test');
        assert.strictEqual(path, 'turn.recognized.entities.test');
    });

    it('AliasPathResolver should should prefix and postfix paths.', function () {
        const resolver = new AliasPathResolver('@', 'turn.recognized.entities.', '.first()');
        const path = resolver.transformPath('@test');
        assert.strictEqual(path, 'turn.recognized.entities.test.first()');
    });

    it('AliasPathResolver should ignore non-matching aliases.', function () {
        const resolver = new AliasPathResolver('@', 'turn.recognized.entities.', '.first()');
        const path = resolver.transformPath('$test');
        assert.strictEqual(path, '$test');
    });

    it('AtAtPathResolver should transform @@ aliases.', function () {
        const resolver = new AtAtPathResolver();
        const path = resolver.transformPath('@@test');
        assert.strictEqual(path, 'turn.recognized.entities.test');
    });

    it('AtPathResolver should transform @ aliases.', function () {
        const resolver = new AtPathResolver();
        assert.strictEqual(resolver.transformPath('@test'), 'turn.recognized.entities.test.first()');
        assert.strictEqual(resolver.transformPath('@test.bar'), 'turn.recognized.entities.test.first().bar');
    });

    it('DollarPathResolver should transform $ aliases.', function () {
        const resolver = new DollarPathResolver();
        const path = resolver.transformPath('$test');
        assert.strictEqual(path, 'dialog.test');
    });

    it('HashPathResolver should transform # aliases.', function () {
        const resolver = new HashPathResolver();
        const path = resolver.transformPath('#test');
        assert.strictEqual(path, 'turn.recognized.intents.test');
    });

    it('PercentPathResolver should transform % aliases.', function () {
        const resolver = new PercentPathResolver();
        const path = resolver.transformPath('%test');
        assert.strictEqual(path, 'class.test');
    });
});
