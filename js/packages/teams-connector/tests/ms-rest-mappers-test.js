const msRest = require('@azure/ms-rest-js');
const Mappers = require('../lib/connectorApi/models/mappers');
const Serializer = new msRest.Serializer({ Activity: Mappers.Activity, Entity: Mappers.Entity });
const assert = require('assert');

describe('serialize', function () {
    const entity = [{ type: 'mention', keyone: 'valueOne', keytwo: { keythree: 'valueThree' } }];
    const activity = { type: 'message', entities: entity };
    it('should retain custom Entity properties', function () {
        const serializedObject = Serializer.serialize(Mappers.Activity, activity);
        assert.deepStrictEqual(serializedObject.entities, entity);
    });
});
