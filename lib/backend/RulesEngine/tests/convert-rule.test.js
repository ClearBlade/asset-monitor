"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var convert_rule_1 = require("../convert-rule");
describe('convertRule', function () {
    it('convertRuleTest', function () {
        var ruleInfo = {
            id: name,
            name: name,
        };
        var rule = {
            name: name,
            conditions: {},
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
        var conditions = {
            and: [
                {
                    entity: {
                        id: 'AAUSMIN201',
                        entity_type: 'assets',
                    },
                    relationship: {
                        operator: 'outside',
                        attribute: 'customer',
                        attribute_type: 'area_types',
                        duration: {
                            value: 1,
                            unit: 'h',
                        },
                    },
                },
            ],
        };
        // Adam did this
        // @ts-ignore
        convert_rule_1.ParseAndConvertConditions(ruleInfo, rule.conditions, conditions);
        expect(rule.conditions).toEqual({
            all: [
                { fact: 'id', operator: 'equal', value: 'AAUSMIN201' },
                { fact: 'customer', operator: 'equal', value: 'outside' },
            ],
        });
    });
});
