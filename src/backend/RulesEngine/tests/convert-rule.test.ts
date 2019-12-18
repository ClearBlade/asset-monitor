import { ParseAndConvertConditions } from "../convert-rule"
import { AllRulesEngineConditions } from "../types"

describe("convertRule", function(){
    it("convertRuleTest", function(){
        let conditions = {
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
        let rule: Rule = {
            name: name,
            conditions: {} as AllRulesEngineConditions,
            event: {
              type: name,
              params: {
                "cool": "awesome"
              }
            }
          };
        ParseAndConvertConditions(rule.conditions, conditions);
        expect(rule.conditions).toEqual({"all":[{"fact":"id","operator":"equal","value":"AAUSMIN201"},{"fact":"customer","operator":"equal","value":"outside"}]});
    })
})