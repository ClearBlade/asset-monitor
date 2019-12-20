import {
    AllConditions,
    Condition,
    ConditionalOperators,
    RulesEngineCondition,
    RulesEngineConditionalOperators,
    AllRulesEngineConditions,
    OperatorAndValue,
    Entity,
    EntityTypes,
    GetOperatorAndValue,
    Relationship,
    RuleInfo,
} from './types';
import { AddDuration } from './duration';
import "../../static/promise-polyfill";
import { getAllAreasForType, getAllAssetsForType } from './async';

export function ParseAndConvertConditions(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, conditions: AllConditions): Promise<AllRulesEngineConditions> {
    if(conditions.hasOwnProperty('and')) {
      rule[RulesEngineConditionalOperators.AND] = []
      const subConditions: Array<Condition | AllConditions> = conditions[ConditionalOperators.AND];
      const promise = Promise.all(subConditions.map((s) => convertANDCondition(ruleInfo, rule, s))).then(() => {
        return rule
      })
      // @ts-ignore
      Promise.runQueue();
      return promise;
    } else { // is an OR
      rule[RulesEngineConditionalOperators.OR] = [];
      const subConditions: Array<Condition | AllConditions> = conditions[ConditionalOperators.OR];
      const promise = Promise.all(subConditions.map((s) => convertORCondition(ruleInfo, rule, s))).then(() => {
        return rule
      })
      // @ts-ignore
      Promise.runQueue();
      return promise;
    }
}

  function convertANDCondition(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, condition: Condition | AllConditions): Promise<AllRulesEngineConditions> {
    if(condition.hasOwnProperty('entity')) { // We have a condition
      const promise = addANDConditions(ruleInfo, rule, condition as Condition)
      // @ts-ignore
      Promise.runQueue();
      return promise;
    } else { // Seems like we have nested conditions
      rule[RulesEngineConditionalOperators.AND].push({} as AllRulesEngineConditions)
      let len: number = rule[RulesEngineConditionalOperators.AND].length;
      const promise = ParseAndConvertConditions(ruleInfo, rule[RulesEngineConditionalOperators.AND][len - 1] as AllRulesEngineConditions, condition as AllConditions);
      // @ts-ignore
      Promise.runQueue();
      return promise;
    }
}

  function convertORCondition(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, condition: Condition | AllConditions): Promise<AllRulesEngineConditions> {
    if(condition.hasOwnProperty('entity')) { // We have a condition
      rule[RulesEngineConditionalOperators.OR].push({} as AllRulesEngineConditions)
      let len: number = rule[RulesEngineConditionalOperators.OR].length;
      rule[RulesEngineConditionalOperators.AND] = [];
      const promise = addANDConditions(ruleInfo, rule[RulesEngineConditionalOperators.OR][len - 1] as AllRulesEngineConditions, condition as Condition);
      //@ts-ignore
      Promise.runQueue();
      return promise;
    } else { // Seems like we have nested conditions
      rule[RulesEngineConditionalOperators.OR].push({} as AllRulesEngineConditions)
      let len: number = rule[RulesEngineConditionalOperators.OR].length;
      const promise = ParseAndConvertConditions(ruleInfo, rule[RulesEngineConditionalOperators.OR][len - 1] as AllRulesEngineConditions, condition as AllConditions);
      //@ts-ignore
      Promise.runQueue();
      return promise;
    }
}

  function addANDConditions(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, condition: Condition): Promise<AllRulesEngineConditions> {
    const promise = addSpecificEntityCondition(condition as Condition, rule).then((rule) => {
      if((condition as Condition).relationship.attribute_type === EntityTypes.ASSET || (condition as Condition).relationship.attribute_type === EntityTypes.AREA ||
      (condition as Condition).relationship.attribute_type === EntityTypes.STATE) {
        let rval: OperatorAndValue = GetOperatorAndValue((condition as Condition).relationship.operator, (condition as Condition).relationship.value)
        AddDuration(ruleInfo.id, ruleInfo.id, (condition as Condition).relationship.attribute, (condition as Condition).relationship.duration);
        let newCondition: RulesEngineCondition = {
          fact: (condition as Condition).relationship.attribute,
          operator: rval.operator,
          value: rval.value
        };
        rule[RulesEngineConditionalOperators.AND].push(newCondition);
        return new Promise((res) => res(rule));
      } else {
        let attributeCondition: AllRulesEngineConditions = {} as AllRulesEngineConditions;
        const promise = createConditionsForAttribute(ruleInfo, attributeCondition, (condition as Condition).relationship).then((hasCondition) => {
          if(hasCondition) {
            rule[RulesEngineConditionalOperators.AND].push(attributeCondition);
          }
          return rule;
        })
        // @ts-ignore
        Promise.runQueue();
        return promise;
      }
    })
    //@ts-ignore
    Promise.runQueue();
    //@ts-ignore - Adam
    return promise;
  }

  function addSpecificEntityCondition(condition: Condition, rule: AllRulesEngineConditions): Promise<AllRulesEngineConditions> {
    if((condition as Condition).entity.entity_type === EntityTypes.ASSET || (condition as Condition).entity.entity_type === EntityTypes.AREA ||
    (condition as Condition).entity.entity_type === EntityTypes.STATE) {
      let entityCondition: RulesEngineCondition = {
        fact: "id",
        operator: "equal",
        value: (condition as Condition).entity.id
      };
      rule[RulesEngineConditionalOperators.AND].push(entityCondition);
      return new Promise((res) => res(rule));
    } else {
      let entityCondition: AllRulesEngineConditions = {} as AllRulesEngineConditions;
      const promise = createConditionsForEntity(entityCondition, (condition as Condition).entity).then((hasCondition) => {
        if (hasCondition) {
          rule[RulesEngineConditionalOperators.AND].push(entityCondition);
        }
        return rule;
      })
      // @ts-ignore
      Promise.runQueue();
      return promise;
    }
}

  function createConditionsForEntity(rule: AllRulesEngineConditions, entity: Entity): Promise<boolean> {
    let promise;
    switch(entity.entity_type) {
      case EntityTypes.ASSET_TYPE:
        promise = getAllAssetsForType(entity.id).then((assets) => {
          if(assets.length > 0) {
            rule[RulesEngineConditionalOperators.OR] = []
            for(let i = 0; i < assets.length; i++) {
              let entityCondition: RulesEngineCondition = {
                fact: "id",
                operator: "equal",
                value: assets[i].id as string
              };
              rule[RulesEngineConditionalOperators.OR].push(entityCondition);
            }
            return true;
          }
          return false
        })
        //@ts-ignore
        Promise.runQueue();
        return promise;
      case EntityTypes.AREA_TYPE:
        promise = getAllAreasForType(entity.id).then((areas) => {
          if(areas.length > 0) {
            rule[RulesEngineConditionalOperators.OR] = []
            for(let i = 0; i < areas.length; i++) {
              let entityCondition: RulesEngineCondition = {
                fact: "id",
                operator: "equal",
                value: areas[i].id
              };
              rule[RulesEngineConditionalOperators.OR].push(entityCondition);
            }
            return true;
          }
          return false; 
        })
        //@ts-ignore
        Promise.runQueue();
        return promise;
      default:
        return new Promise((res) => res(false));
    }
}

  function createConditionsForAttribute(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, relationship: Relationship): Promise<boolean> {
    let promise;
    switch(relationship.attribute_type) {
      case EntityTypes.ASSET_TYPE:
        promise = getAllAssetsForType(relationship.attribute).then((assets) => {
          if(assets.length > 0) {
            rule[RulesEngineConditionalOperators.OR] = []
            let rval: OperatorAndValue = GetOperatorAndValue(relationship.operator, relationship.value)
            for(let i = 0; i < assets.length; i++) {
              AddDuration(ruleInfo.id, ruleInfo.id, assets[i].id as string, relationship.duration);
              let attributeCondition: RulesEngineCondition = {
                fact: assets[i].id as string,
                operator: rval.operator,
                value: rval.value
              };
              rule[RulesEngineConditionalOperators.OR].push(attributeCondition);
            }
            return true;
          }
          return false
        })
        //@ts-ignore
        Promise.runQueue();
        return promise;
      case EntityTypes.AREA_TYPE:
        promise = getAllAreasForType(relationship.attribute).then((areas) => {
          if(areas.length > 0) {
            rule[RulesEngineConditionalOperators.OR] = []
            let rval2: OperatorAndValue = GetOperatorAndValue(relationship.operator, relationship.value)
            for(let i = 0; i < areas.length; i++) {
              AddDuration(ruleInfo.id, ruleInfo.id, areas[i].id, relationship.duration);
              let attributeCondition: RulesEngineCondition = {
                fact: areas[i].id,
                operator: rval2.operator,
                value: rval2.value
              };
              rule[RulesEngineConditionalOperators.OR].push(attributeCondition);
            }
            return true;          }
          
        })
      default:
        return new Promise((res) => res(false));
    }
  }
