jest.mock('../async');
import { EntityTypes, DurationUnits } from '../types';
import { parseAndConvertConditions } from '../convert-rule';

const id = 'testRuleId';

describe('Convert Rules', function() {
    it('converts basic asset type to state', function() {
        return parseAndConvertConditions(id, conditions.BASIC_ASSET_TYPE_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_ASSET_TYPE_TO_STATE);
        });
    });
    it('converts basic area type to state', function() {
        return parseAndConvertConditions(id, conditions.BASIC_AREA_TYPE_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_AREA_TYPE_TO_STATE);
        });
    });
    it('converts basic asset to state', function() {
        return parseAndConvertConditions(id, conditions.BASIC_ASSET_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_ASSET_TO_STATE);
        });
    });
    it('converts basic double asset to state OR', function() {
        return parseAndConvertConditions(id, conditions.DOUBLE_ASSET_TO_STATE_OR).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.DOUBLE_ASSET_TO_STATE_OR);
        });
    });
    it('converts basic double asset to state AND', function() {
        return parseAndConvertConditions(id, conditions.DOUBLE_ASSET_TO_STATE_AND).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.DOUBLE_ASSET_TO_STATE_AND);
        });
    });
    it('converts basic area to state', function() {
        return parseAndConvertConditions(id, conditions.BASIC_ASSET_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_ASSET_TO_STATE);
        });
    });
    it('converts asset type to state and area AND', function() {
        return parseAndConvertConditions(id, conditions.ASSET_TYPE_TO_STATE_AND_AREA_AND).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.ASSET_TYPE_TO_STATE_AND_AREA_AND);
        });
    });
    it('converts asset type to state and area OR', function() {
        return parseAndConvertConditions(id, conditions.ASSET_TYPE_TO_STATE_AND_AREA_OR).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.ASSET_TYPE_TO_STATE_AND_AREA_OR);
        });
    });
    it('converts nested asset type to state AND', function() {
        return parseAndConvertConditions(id, conditions.NESTED_ASSET_TYPE_TO_STATE_AND).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.NESTED_ASSET_TYPE_TO_STATE_AND);
        });
    });
    it('converts nested asset type to state OR', function() {
        return parseAndConvertConditions(id, conditions.NESTED_ASSET_TYPE_TO_STATE_OR).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.NESTED_ASSET_TYPE_TO_STATE_OR);
        });
    });
});

const conditions = {
    BASIC_ASSET_TYPE_TO_STATE: {
        and: [
            {
                entity: {
                    id: 'train',
                    entity_type: EntityTypes.ASSET_TYPE,
                },
                relationship: {
                    operator: 'equal',
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    value: 50,
                    duration: {
                        value: 10,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    BASIC_AREA_TYPE_TO_STATE: {
        and: [
            {
                entity: {
                    id: 'yard',
                    entity_type: EntityTypes.AREA_TYPE,
                },
                relationship: {
                    operator: 'equal',
                    attribute: 'temperature',
                    attribute_type: EntityTypes.STATE,
                    value: 50,
                    duration: {
                        value: 10,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    BASIC_ASSET_TO_STATE: {
        and: [
            {
                entity: {
                    id: 'testAsset1',
                    entity_type: EntityTypes.ASSET,
                },
                relationship: {
                    operator: 'equal',
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    value: 50,
                    duration: {
                        value: 10,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    DOUBLE_ASSET_TO_STATE_OR: {
        or: [
            {
                entity: {
                    id: 'testAsset1',
                    entity_type: EntityTypes.ASSET,
                },
                relationship: {
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    operator: 'greaterThan',
                    value: 50,
                    duration: {
                        value: 15,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
            {
                entity: {
                    id: 'testAsset1',
                    entity_type: EntityTypes.ASSET,
                },
                relationship: {
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    operator: 'lessThan',
                    value: 40,
                    duration: {
                        value: 15,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    DOUBLE_ASSET_TO_STATE_AND: {
        and: [
            {
                entity: {
                    id: 'testAsset1',
                    entity_type: EntityTypes.ASSET,
                },
                relationship: {
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    operator: 'greaterThan',
                    value: 50,
                    duration: {
                        value: 15,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
            {
                entity: {
                    id: 'testAsset1',
                    entity_type: EntityTypes.ASSET,
                },
                relationship: {
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    operator: 'lessThan',
                    value: 40,
                    duration: {
                        value: 15,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    BASIC_AREA_TO_STATE: {
        and: [
            {
                entity: {
                    id: 'testArea1',
                    entity_type: EntityTypes.AREA,
                },
                relationship: {
                    operator: 'equal',
                    attribute: 'temperature',
                    attribute_type: EntityTypes.STATE,
                    value: 50,
                    duration: {
                        value: 10,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    ASSET_TYPE_TO_STATE_AND_AREA_AND: {
        and: [
            {
                entity: {
                    id: 'train',
                    entity_type: EntityTypes.ASSET_TYPE,
                },
                relationship: {
                    operator: 'equal',
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    value: 50,
                    duration: {
                        value: 10,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
            {
                entity: {
                    id: 'train',
                    entity_type: EntityTypes.ASSET_TYPE,
                },
                relationship: {
                    operator: 'inside',
                    attribute: 'yard',
                    attribute_type: EntityTypes.AREA_TYPE,
                    duration: {
                        value: 20,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    ASSET_TYPE_TO_STATE_AND_AREA_OR: {
        or: [
            {
                entity: {
                    id: 'train',
                    entity_type: EntityTypes.ASSET_TYPE,
                },
                relationship: {
                    operator: 'equal',
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    value: 50,
                    duration: {
                        value: 10,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
            {
                entity: {
                    id: 'train',
                    entity_type: EntityTypes.ASSET_TYPE,
                },
                relationship: {
                    operator: 'outside',
                    attribute: 'yard',
                    attribute_type: EntityTypes.AREA_TYPE,
                    duration: {
                        value: 20,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    NESTED_ASSET_TYPE_TO_STATE_AND: {
        and: [
            {
                or: [
                    {
                        entity: {
                            id: 'train',
                            entity_type: EntityTypes.ASSET_TYPE,
                        },
                        relationship: {
                            operator: 'equal',
                            attribute: 'speed',
                            attribute_type: EntityTypes.STATE,
                            value: 50,
                            duration: {
                                value: 10,
                                unit: DurationUnits.SECONDS,
                            },
                        },
                    },
                    {
                        entity: {
                            id: 'train',
                            entity_type: EntityTypes.ASSET_TYPE,
                        },
                        relationship: {
                            operator: 'equal',
                            attribute: 'speed',
                            attribute_type: EntityTypes.STATE,
                            value: 60,
                            duration: {
                                value: 20,
                                unit: DurationUnits.SECONDS,
                            },
                        },
                    },
                ],
            },
            {
                entity: {
                    id: 'train',
                    entity_type: EntityTypes.ASSET_TYPE,
                },
                relationship: {
                    operator: 'equal',
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    value: 70,
                    duration: {
                        value: 30,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
    NESTED_ASSET_TYPE_TO_STATE_OR: {
        or: [
            {
                and: [
                    {
                        entity: {
                            id: 'train',
                            entity_type: EntityTypes.ASSET_TYPE,
                        },
                        relationship: {
                            operator: 'equal',
                            attribute: 'speed',
                            attribute_type: EntityTypes.STATE,
                            value: 50,
                            duration: {
                                value: 10,
                                unit: DurationUnits.SECONDS,
                            },
                        },
                    },
                    {
                        entity: {
                            id: 'train',
                            entity_type: EntityTypes.ASSET_TYPE,
                        },
                        relationship: {
                            operator: 'equal',
                            attribute: 'speed',
                            attribute_type: EntityTypes.STATE,
                            value: 60,
                            duration: {
                                value: 20,
                                unit: DurationUnits.SECONDS,
                            },
                        },
                    },
                ],
            },
            {
                entity: {
                    id: 'train',
                    entity_type: EntityTypes.ASSET_TYPE,
                },
                relationship: {
                    operator: 'equal',
                    attribute: 'speed',
                    attribute_type: EntityTypes.STATE,
                    value: 70,
                    duration: {
                        value: 30,
                        unit: DurationUnits.SECONDS,
                    },
                },
            },
        ],
    },
};

const parsedConditions = {
    BASIC_ASSET_TYPE_TO_STATE: {
        any: [
            {
                fact: 'entity',
                operator: 'equal',
                params: {
                    id: 'testAsset1',
                    attribute: 'speed',
                    collection: 'assets',
                    type: 'train',
                    duration: 10000,
                },
                path: '.data.custom_data.speed',
                value: 50,
            },
            {
                fact: 'entity',
                operator: 'equal',
                params: {
                    id: 'testAsset2',
                    attribute: 'speed',
                    collection: 'assets',
                    type: 'train',
                    duration: 10000,
                },
                path: '.data.custom_data.speed',
                value: 50,
            },
        ],
    },
    BASIC_AREA_TYPE_TO_STATE: {
        any: [
            {
                fact: 'entity',
                operator: 'equal',
                params: {
                    id: 'testArea1',
                    attribute: 'temperature',
                    collection: 'areas',
                    type: 'yard',
                    duration: 10000,
                },
                path: '.data.custom_data.temperature',
                value: 50,
            },
            {
                fact: 'entity',
                operator: 'equal',
                params: {
                    id: 'testArea2',
                    attribute: 'temperature',
                    collection: 'areas',
                    type: 'yard',
                    duration: 10000,
                },
                path: '.data.custom_data.temperature',
                value: 50,
            },
        ],
    },
    BASIC_ASSET_TO_STATE: {
        any: [
            {
                fact: 'entity',
                operator: 'equal',
                params: {
                    id: 'testAsset1',
                    attribute: 'speed',
                    collection: 'assets',
                    type: null,
                    duration: 10000,
                },
                path: '.data.custom_data.speed',
                value: 50,
            },
        ],
    },
    DOUBLE_ASSET_TO_STATE_OR: {
        any: [
            {
                fact: 'entity',
                operator: 'greaterThan',
                params: {
                    id: 'testAsset1',
                    attribute: 'speed',
                    collection: 'assets',
                    type: null,
                    duration: 15000,
                },
                path: '.data.custom_data.speed',
                value: 50,
            },
            {
                fact: 'entity',
                operator: 'lessThan',
                params: {
                    id: 'testAsset1',
                    attribute: 'speed',
                    collection: 'assets',
                    type: null,
                    duration: 15000,
                },
                path: '.data.custom_data.speed',
                value: 40,
            },
        ],
    },
    DOUBLE_ASSET_TO_STATE_AND: {
        all: [
            {
                fact: 'entity',
                operator: 'greaterThan',
                params: {
                    id: 'testAsset1',
                    attribute: 'speed',
                    collection: 'assets',
                    type: null,
                    duration: 15000,
                },
                path: '.data.custom_data.speed',
                value: 50,
            },
            {
                fact: 'entity',
                operator: 'lessThan',
                params: {
                    id: 'testAsset1',
                    attribute: 'speed',
                    collection: 'assets',
                    type: null,
                    duration: 15000,
                },
                path: '.data.custom_data.speed',
                value: 40,
            },
        ],
    },
    BASIC_AREA_TO_STATE: {
        any: [
            {
                fact: 'entity',
                operator: 'equal',
                params: {
                    id: 'testArea1',
                    attribute: 'temperature',
                    collection: 'areas',
                    type: null,
                    duration: 10000,
                },
                path: '.data.custom_data.temperature',
                value: 50,
            },
        ],
    },
    ASSET_TYPE_TO_STATE_AND_AREA_AND: {
        all: [
            {
                any: [
                    {
                        fact: 'entity',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train',
                            duration: 10000,
                        },
                        path: '.data.custom_data.speed',
                        value: 50,
                    },
                    {
                        fact: 'entity',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train',
                            duration: 10000,
                        },
                        path: '.data.custom_data.speed',
                        value: 50,
                    },
                ],
            },
            {
                any: [
                    {
                        fact: 'entity',
                        operator: 'inside',
                        params: {
                            id: 'testAsset1',
                            collection: 'assets',
                            type: 'train',
                            duration: 20000,
                        },
                        value: {
                            fact: 'entity',
                            params: {
                                id: 'testArea1',
                                collection: 'areas',
                                type: 'yard',
                            },
                        },
                    },
                    {
                        fact: 'entity',
                        operator: 'inside',
                        params: {
                            id: 'testAsset1',
                            collection: 'assets',
                            type: 'train',
                            duration: 20000,
                        },
                        value: {
                            fact: 'entity',
                            params: {
                                id: 'testArea2',
                                collection: 'areas',
                                type: 'yard',
                            },
                        },
                    },
                    {
                        fact: 'entity',
                        operator: 'inside',
                        params: {
                            id: 'testAsset2',
                            collection: 'assets',
                            type: 'train',
                            duration: 20000,
                        },
                        value: {
                            fact: 'entity',
                            params: {
                                id: 'testArea1',
                                collection: 'areas',
                                type: 'yard',
                            },
                        },
                    },
                    {
                        fact: 'entity',
                        operator: 'inside',
                        params: {
                            id: 'testAsset2',
                            collection: 'assets',
                            type: 'train',
                            duration: 20000,
                        },
                        value: {
                            fact: 'entity',
                            params: {
                                id: 'testArea2',
                                collection: 'areas',
                                type: 'yard',
                            },
                        },
                    },
                ],
            },
        ],
    },
    ASSET_TYPE_TO_STATE_AND_AREA_OR: {
        any: [
            {
                any: [
                    {
                        fact: 'entity',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train',
                            duration: 10000,
                        },
                        path: '.data.custom_data.speed',
                        value: 50,
                    },
                    {
                        fact: 'entity',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train',
                            duration: 10000,
                        },
                        path: '.data.custom_data.speed',
                        value: 50,
                    },
                ],
            },
            {
                any: [
                    {
                        fact: 'entity',
                        operator: 'outside',
                        params: {
                            id: 'testAsset1',
                            collection: 'assets',
                            type: 'train',
                            duration: 20000,
                        },
                        value: {
                            fact: 'entity',
                            params: {
                                id: 'testArea1',
                                collection: 'areas',
                                type: 'yard',
                            },
                        },
                    },
                    {
                        fact: 'entity',
                        operator: 'outside',
                        params: {
                            id: 'testAsset1',
                            collection: 'assets',
                            type: 'train',
                            duration: 20000,
                        },
                        value: {
                            fact: 'entity',
                            params: {
                                id: 'testArea2',
                                collection: 'areas',
                                type: 'yard',
                            },
                        },
                    },
                    {
                        fact: 'entity',
                        operator: 'outside',
                        params: {
                            id: 'testAsset2',
                            collection: 'assets',
                            type: 'train',
                            duration: 20000,
                        },
                        value: {
                            fact: 'entity',
                            params: {
                                id: 'testArea1',
                                collection: 'areas',
                                type: 'yard',
                            },
                        },
                    },
                    {
                        fact: 'entity',
                        operator: 'outside',
                        params: {
                            id: 'testAsset2',
                            collection: 'assets',
                            type: 'train',
                            duration: 20000,
                        },
                        value: {
                            fact: 'entity',
                            params: {
                                id: 'testArea2',
                                collection: 'areas',
                                type: 'yard',
                            },
                        },
                    },
                ],
            },
        ],
    },
    NESTED_ASSET_TYPE_TO_STATE_AND: {
        all: [
            {
                any: [
                    {
                        any: [
                            {
                                fact: 'entity',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 10000,
                                },
                                path: '.data.custom_data.speed',
                                value: 50,
                            },
                            {
                                fact: 'entity',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 10000,
                                },
                                path: '.data.custom_data.speed',
                                value: 50,
                            },
                        ],
                    },
                    {
                        any: [
                            {
                                fact: 'entity',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 20000,
                                },
                                path: '.data.custom_data.speed',
                                value: 60,
                            },
                            {
                                fact: 'entity',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 20000,
                                },
                                path: '.data.custom_data.speed',
                                value: 60,
                            },
                        ],
                    },
                ],
            },
            {
                any: [
                    {
                        fact: 'entity',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train',
                            duration: 30000,
                        },
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                    {
                        fact: 'entity',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train',
                            duration: 30000,
                        },
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                ],
            },
        ],
    },
    NESTED_ASSET_TYPE_TO_STATE_OR: {
        any: [
            {
                all: [
                    {
                        any: [
                            {
                                fact: 'entity',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 10000,
                                },
                                path: '.data.custom_data.speed',
                                value: 50,
                            },
                            {
                                fact: 'entity',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 10000,
                                },
                                path: '.data.custom_data.speed',
                                value: 50,
                            },
                        ],
                    },
                    {
                        any: [
                            {
                                fact: 'entity',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 20000,
                                },
                                path: '.data.custom_data.speed',
                                value: 60,
                            },
                            {
                                fact: 'entity',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 20000,
                                },
                                path: '.data.custom_data.speed',
                                value: 60,
                            },
                        ],
                    },
                ],
            },
            {
                any: [
                    {
                        fact: 'entity',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train',
                            duration: 30000,
                        },
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                    {
                        fact: 'entity',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train',
                            duration: 30000,
                        },
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                ],
            },
        ],
    },
};
