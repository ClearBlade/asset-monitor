jest.mock("../async");
import { AllRulesEngineConditions, Rule } from "../types";
import { ParseAndConvertConditions } from '../convert-rule';

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

describe("convert rules", function(){
    it("convertRuleTest", function(){
        const conditions = {
            "and": [
                {
                    "entity": {
                        "id": "train",
                        "entity_type": "asset_types"
                    },
                    "relationship": {
                        "operator": "greaterThan",
                        "attribute": "speed",
                        "attribute_type": "state",
                        "value": 50,
                        "duration": {
                            "value": 10,
                            "unit": "s"
                        }
                    }
                }
            ]
        };

        //@ts-ignore - Adam
        ParseAndConvertConditions(ruleInfo, rule.conditions, conditions).then((convertedRule) => {
            expect(convertedRule).toEqual({
                "all":[{
                    "any":[{
                        "fact":"id",
                        "operator":"equal",
                        "value":"testAsset1"
                    },{
                        "fact":"id",
                        "operator":"equal",
                        "value":"testAsset2"
                    }]
                },{
                    "fact":"speed",
                    "operator":"greaterThan",
                    "value":50
                }]
            });
        });
    })
})