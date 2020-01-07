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
    it('converts basic area to state', function() {
        return parseAndConvertConditions(id, conditions.BASIC_ASSET_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_ASSET_TO_STATE);
        });
    });
    it('converts asset type to state AND', function() {
        return parseAndConvertConditions(id, conditions.ASSET_TYPE_TO_STATE_AND).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.ASSET_TYPE_TO_STATE_AND);
        });
    });
    it('converts asset type to state OR', function() {
        return parseAndConvertConditions(id, conditions.ASSET_TYPE_TO_STATE_OR).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.ASSET_TYPE_TO_STATE_OR);
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
    ASSET_TYPE_TO_STATE_AND: {
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
            }
        ]
    },
    ASSET_TYPE_TO_STATE_OR: {
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
            }
        ]
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
                    }
                ]
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
                    }
                ]
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
}

const parsedConditions = {
    BASIC_ASSET_TYPE_TO_STATE: {
        any: [
            {
                fact: 'state',
                operator: 'equal',
                params: {
                    id: 'testAsset1',
                    attribute: 'speed',
                    collection: 'assets',
                    type: 'train'
                },
                path: '.custom_data.speed.value',
                value: 50
            },
            {
                fact: 'state',
                operator: 'equal',
                params: {
                    id: 'testAsset2',
                    attribute: 'speed',
                    collection: 'assets',
                    type: 'train'
                },
                path: '.custom_data.speed.value',
                value: 50
            }
        ]
    },
    BASIC_AREA_TYPE_TO_STATE: {
        any: [
            {
                fact: 'state',
                operator: 'equal',
                params: {
                    id: 'testArea1',
                    attribute: 'temperature',
                    collection: 'areas',
                    type: 'yard'
                },
                path: '.custom_data.temperature.value',
                value: 50
            },
            {
                fact: 'state',
                operator: 'equal',
                params: {
                    id: 'testArea2',
                    attribute: 'temperature',
                    collection: 'areas',
                    type: 'yard'
                },
                path: '.custom_data.temperature.value',
                value: 50
            }
        ]
    },
    BASIC_ASSET_TO_STATE: {
        any: [
            {
                fact: 'state',
                operator: 'equal',
                params: {
                    id: 'testAsset1',
                    attribute: 'speed',
                    collection: 'assets',
                    type: null
                },
                path: '.custom_data.speed.value',
                value: 50
            }
        ],
    },
    BASIC_AREA_TO_STATE: {
        any: [
            {
                fact: 'state',
                operator: 'equal',
                params: {
                    id: 'testArea1',
                    attribute: 'temperature',
                    collection: 'areas',
                    type: null
                },
                path: '.custom_data.temperature.value',
                value: 50
            },
        ],
    },
    ASSET_TYPE_TO_STATE_AND: {
        all: [
            {
                any: [
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 50
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 50
                    }
                ]
            },
            {
                any: [
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 60
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 60
                    }
                ]
            }
        ]
    },
    ASSET_TYPE_TO_STATE_OR: {
        any: [
            {
                any: [
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 50
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 50
                    }
                ]
            },
            {
                any: [
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 60
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 60
                    }
                ]
            }
        ]
    },
    NESTED_ASSET_TYPE_TO_STATE_AND: {
        all: [
            {
                any: [
                    {
                        any: [
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train'
                                },
                                path: '.custom_data.speed.value',
                                value: 50
                            },
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train'
                                },
                                path: '.custom_data.speed.value',
                                value: 50
                            }
                        ]
                    },
                    {
                        any: [
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train'
                                },
                                path: '.custom_data.speed.value',
                                value: 60
                            },
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train'
                                },
                                path: '.custom_data.speed.value',
                                value: 60
                            }
                        ]
                    }     
                ]
            },
            {
                any: [
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 70
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 70
                    }
                ]
            }
        ]
    },
    NESTED_ASSET_TYPE_TO_STATE_OR: {
        any: [
            {
                all: [
                    {
                        any: [
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train'
                                },
                                path: '.custom_data.speed.value',
                                value: 50
                            },
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train'
                                },
                                path: '.custom_data.speed.value',
                                value: 50
                            }
                        ]
                    },
                    {
                        any: [
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train'
                                },
                                path: '.custom_data.speed.value',
                                value: 60
                            },
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train'
                                },
                                path: '.custom_data.speed.value',
                                value: 60
                            }
                        ]
                    }     
                ]
            },
            {
                any: [
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 70
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'train'
                        },
                        path: '.custom_data.speed.value',
                        value: 70
                    }
                ]
            }
        ]
    },
}
