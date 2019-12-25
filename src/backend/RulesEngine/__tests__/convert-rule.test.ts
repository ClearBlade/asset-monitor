jest.mock('../async');
import { AllRulesEngineConditions, Rule, EntityTypes, DurationUnits } from '../types';
import { ParseAndConvertConditions } from '../convert-rule';

const id = 'testRuleId';
const name = 'testRuleName';

const ruleInfo = {
    id,
    name
};

const rule: Rule = {
    name: name,
    conditions: {} as AllRulesEngineConditions,
    event: {
        type: name,
        params: {
            eventTypeID: 'test',
            actionIDs: ['test'],
            priority: 1,
            severity: 1,
            ruleID: 'id',
            ruleName: name,
        },
    },
};

describe('Convert Rules', function() {
    it('converts basic asset type to state', function() {
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions.BASIC_ASSET_TYPE_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_ASSET_TYPE_TO_STATE);
        });
    });
    it('converts basic area type to state', function() {
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions.BASIC_AREA_TYPE_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_AREA_TYPE_TO_STATE);
        });
    });
    it('converts basic asset to state', function() {
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions.BASIC_ASSET_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_ASSET_TO_STATE);
        });
    });
    it('converts basic area to state', function() {
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions.BASIC_ASSET_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.BASIC_ASSET_TO_STATE);
        });
    });
    it('converts asset type to state AND', function() {
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions.ASSET_TYPE_TO_STATE_AND).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.ASSET_TYPE_TO_STATE_AND);
        });
    });
    it('converts asset type to state OR', function() {
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions.ASSET_TYPE_TO_STATE_OR).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.ASSET_TYPE_TO_STATE_OR);
        });
    });
    it('converts nested asset type to state', function() {
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions.NESTED_ASSET_TYPE_TO_STATE).then(convertedRule => {
            expect(convertedRule).toEqual(parsedConditions.NESTED_ASSET_TYPE_TO_STATE);
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
    NESTED_ASSET_TYPE_TO_STATE: {
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
        all: [
            {
                any: [
                    {
                        fact: 'id',
                        operator: 'equal',
                        value: 'testAsset1',
                    },
                    {
                        fact: 'id',
                        operator: 'equal',
                        value: 'testAsset2',
                    },
                ],
            },
            {
                fact: 'speed',
                operator: 'equal',
                value: 50,
            },
        ],
    },
    BASIC_AREA_TYPE_TO_STATE: {
        all: [
            {
                any: [
                    {
                        fact: 'id',
                        operator: 'equal',
                        value: 'testArea1',
                    },
                    {
                        fact: 'id',
                        operator: 'equal',
                        value: 'testArea2',
                    },
                ],
            },
            {
                fact: 'temperature',
                operator: 'equal',
                value: 50,
            },
        ],
    },
    BASIC_ASSET_TO_STATE: {
        all: [
            {
                fact: 'id',
                operator: 'equal',
                value: 'testAsset1',
            },
            {
                fact: 'speed',
                operator: 'equal',
                value: 50,
            },
        ],
    },
    BASIC_AREA_TO_STATE: {
        all: [
            {
                fact: 'id',
                operator: 'equal',
                value: 'testArea1',
            },
            {
                fact: 'temperature',
                operator: 'equal',
                value: 50,
            },
        ],
    },
    ASSET_TYPE_TO_STATE_AND: {
        all: [
            {
                all: [
                    {
                        any: [
                            {
                                fact: 'id',
                                operator: 'equal',
                                value: 'testAsset1',
                            },
                            {
                                fact: 'id',
                                operator: 'equal',
                                value: 'testAsset2',
                            },
                        ],
                    },
                    {
                        fact: 'speed',
                        operator: 'equal',
                        value: 50,
                    },
                ],
            },
            {
                all: [
                    {
                        any: [
                            {
                                fact: 'id',
                                operator: 'equal',
                                value: 'testAsset1',
                            },
                            {
                                fact: 'id',
                                operator: 'equal',
                                value: 'testAsset2',
                            },
                        ],
                    },
                    {
                        fact: 'speed',
                        operator: 'equal',
                        value: 60,
                    },
                ],
            }
        ]
    },
    ASSET_TYPE_TO_STATE_OR: {
        any: [
            {
                all: [
                    {
                        any: [
                            {
                                fact: 'id',
                                operator: 'equal',
                                value: 'testAsset1',
                            },
                            {
                                fact: 'id',
                                operator: 'equal',
                                value: 'testAsset2',
                            },
                        ],
                    },
                    {
                        fact: 'speed',
                        operator: 'equal',
                        value: 50,
                    },
                ],
            },
            {
                all: [
                    {
                        any: [
                            {
                                fact: 'id',
                                operator: 'equal',
                                value: 'testAsset1',
                            },
                            {
                                fact: 'id',
                                operator: 'equal',
                                value: 'testAsset2',
                            },
                        ],
                    },
                    {
                        fact: 'speed',
                        operator: 'equal',
                        value: 60,
                    },
                ],
            }
        ]
    },
    NESTED_ASSET_TYPE_TO_STATE: {
        "any": [
            {
                "all": [
                    {
                        "any": [
                            { 
                                "fact": "id",
                                "operator": "equal",
                                "value": "testAsset1"
                            },{
                                "fact": "id",
                                "operator": "equal",
                                "value": "testAsset2"
                            }
                        ]
                    },
                    {
                        "fact": "speed",
                        "operator": "equal",
                        "value": 50
                    },
                    {
                        "any": [
                            { 
                                "fact": "id",
                                "operator": "equal",
                                "value": "testAsset1"
                            },
                            {
                                "fact": "id",
                                "operator": "equal",
                                "value": "testAsset2"
                            }
                        ]
                    },
                    {
                        "fact": "speed",
                        "operator": "equal",
                        "value": 60
                    }
                ]
            },
            {
                "all": [
                    {
                        "any": [
                            { 
                                "fact": "id",
                                "operator": "equal",
                                "value": "testAsset1"
                            },
                            {
                                "fact": "id",
                                "operator": "equal",
                                "value": "testAsset2"
                            }
                        ]
                    },
                    {
                        "fact": "speed",
                        "operator": "equal",
                        "value": 70
                    }
                ]
            }
        ]
    },
}
