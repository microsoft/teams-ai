import { strict as assert } from 'assert';
import { TurnState } from './TurnState';
import { TurnStateProperty } from './TurnStateProperty';
import { createTestTurnContextAndState } from './internals/testing/TestUtilities';
import { TestAdapter } from 'botbuilder';

describe('TurnStateProperty', () => {
    it('should throw an error when TurnState is missing state scope named scope', () => {
        const state = new TurnState();
        const scopeName = 'scope';
        const propertyName = 'propertyName';

        assert.throws(() => new TurnStateProperty(state, scopeName, propertyName)),
            `TurnStateProperty: TurnState missing state scope named "propertyName".`;
    });

    it('should set the turn state property', async () => {
        const adapter = new TestAdapter();
        const [context, state] = await createTestTurnContextAndState(adapter, {
            type: 'message',
            from: {
                id: 'test',
                name: 'test'
            }
        });
        const propertyName = 'tempStateProperty';
        const turnStateProperty = new TurnStateProperty(state, 'temp', propertyName);

        await turnStateProperty.set(context, 'someValue');
        const value = await turnStateProperty.get(context);
        assert.equal(value, 'someValue');
    });

    it('should delete the turn state property', async () => {
        const adapter = new TestAdapter();
        const [context, state] = await createTestTurnContextAndState(adapter, {
            type: 'message',
            from: {
                id: 'test',
                name: 'test'
            }
        });
        const propertyName = 'tempStateProperty';
        const turnStateProperty = new TurnStateProperty(state, 'temp', propertyName);

        await turnStateProperty.set(context, 'someValue');
        await turnStateProperty.delete();
        const value = await turnStateProperty.get(context);
        assert.notEqual(value, 'someValue');
    });
});
