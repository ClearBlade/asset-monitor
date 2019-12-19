import { ParseAndConvertConditions } from "../convert-rule"
import { AllRulesEngineConditions, Rule } from "../types"

describe("convertRule", function(){
    it("convertRuleTest", function(){
        const ruleInfo = {
            id: name,
            name
        }

        let rule: Rule = {
            name: name,
            conditions: {} as AllRulesEngineConditions,
            event: {
                type: name,
                params: {
                    eventTypeID: 'test',
                    actionIDs: ["test"],
                    priority: 1,
                    severity: 1,
                    ruleID: 'id',
                    ruleName: name
                }
            }
        };

        const conditions = {
            "and": [
                {
                    "entity": {
                        "id": "AAUSMIN201",
                        "entity_type": "assets"
                    },
                    "relationship": {
                        "operator": "outside",
                        "attribute": "customer",
                        "attribute_type": "area_types",
                        "duration": {
                            "value": 1,
                            "unit": "h"
                        }
                    }
                }
            ]
        };

        // Adam did this
        // @ts-ignore
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions);
        expect(rule.conditions).toEqual({"all":[{"fact":"id","operator":"equal","value":"AAUSMIN201"},{"fact":"customer","operator":"equal","value":"outside"}]});
    })
})