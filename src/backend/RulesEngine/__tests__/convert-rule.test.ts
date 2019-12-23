jest.mock('../async');
import { AllRulesEngineConditions, Rule, EntityTypes, DurationUnits } from '../types';
import { ParseAndConvertConditions } from '../convert-rule';

const ruleInfo = {
    id: name,
    name,
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

describe('convert rules', function() {
    it('convertRuleTest', function() {
        const conditions = {
            and: [
                {
                    entity: {
                        id: 'train',
                        entity_type: EntityTypes.ASSET_TYPE,
                    },
                    relationship: {
                        operator: 'greaterThan',
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
        };

        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions).then(convertedRule => {
            expect(convertedRule).toEqual({
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
                        operator: 'greaterThan',
                        value: 50,
                    },
                ],
            });
        });
    });
});
