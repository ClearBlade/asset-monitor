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
    RuleInfo
  } from './types'
import { AddDuration } from './duration';

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;

export function ParseAndConvertConditions(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, conditions: AllConditions) {
    if(conditions.hasOwnProperty('and')) {
      rule[RulesEngineConditionalOperators.AND] = []
      convertANDConditions(ruleInfo, rule, conditions);
    } else if(conditions.hasOwnProperty('or')) {
      rule[RulesEngineConditionalOperators.OR] = []
      convertORConditions(ruleInfo, rule, conditions);
    }
  }

  function convertANDConditions(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, conditions: AllConditions) {
    let subConditions: Array<Condition | AllConditions> = conditions[ConditionalOperators.AND];
    for(let i = 0; i < subConditions.length; i++) {
      let condition: Condition | AllConditions = subConditions[i];
      if(condition.hasOwnProperty('entity')) { // We have a condition
        if((condition as Condition).entity.entity_type === EntityTypes.ASSET || (condition as Condition).entity.entity_type === EntityTypes.AREA ||
        (condition as Condition).entity.entity_type === EntityTypes.STATE) {
          let entityCondition: RulesEngineCondition = {
            fact: "id",
            operator: "equal",
            value: (condition as Condition).entity.id
          };
          rule[RulesEngineConditionalOperators.AND].push(entityCondition);
        } else {
          let entityCondition: AllRulesEngineConditions = {} as AllRulesEngineConditions;
          if(createConditionsForEntity(entityCondition, (condition as Condition).entity)) {
            rule[RulesEngineConditionalOperators.AND].push(entityCondition);
          }
        }
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
        } else {
          let attributeCondition: AllRulesEngineConditions = {} as AllRulesEngineConditions;
          if(createConditionsForAttribute(ruleInfo, attributeCondition, (condition as Condition).relationship)) {
            rule[RulesEngineConditionalOperators.AND].push(attributeCondition);
          }
        }
      } else { // Seems like we have nested conditions
        rule[RulesEngineConditionalOperators.AND].push({} as AllRulesEngineConditions)
        let len: number = rule[RulesEngineConditionalOperators.AND].length;
        ParseAndConvertConditions(ruleInfo, rule[RulesEngineConditionalOperators.AND][len - 1] as AllRulesEngineConditions, condition as AllConditions);
      }
    }
  }

  function convertORConditions(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, conditions: AllConditions) {
    let subConditions: Array<Condition | AllConditions> = conditions[ConditionalOperators.OR];
    for(let i = 0; i < subConditions.length; i++) {
      let condition: Condition | AllConditions = subConditions[i];
      if(condition.hasOwnProperty('entity')) { // We have a condition
        rule[RulesEngineConditionalOperators.OR].push({} as AllRulesEngineConditions)
        let len: number = rule[RulesEngineConditionalOperators.OR].length;
        addANDConditions(ruleInfo, rule[RulesEngineConditionalOperators.OR][len - 1] as AllRulesEngineConditions, condition as Condition)
      } else { // Seems like we have nested conditions
        rule[RulesEngineConditionalOperators.OR].push({} as AllRulesEngineConditions)
        let len: number = rule[RulesEngineConditionalOperators.OR].length;
        ParseAndConvertConditions(ruleInfo, rule[RulesEngineConditionalOperators.OR][len - 1] as AllRulesEngineConditions, condition as AllConditions);
      }
    }
  }

  function addANDConditions(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, condition: Condition) {
    rule[RulesEngineConditionalOperators.AND] = []
    if((condition as Condition).entity.entity_type === EntityTypes.ASSET || (condition as Condition).entity.entity_type === EntityTypes.AREA ||
        (condition as Condition).entity.entity_type === EntityTypes.STATE) {
      let entityCondition: RulesEngineCondition = {
        fact: "id",
        operator: "equal",
        value: (condition as Condition).entity.id
      };
      rule[RulesEngineConditionalOperators.AND].push(entityCondition);
    } else {
      let entityCondition: AllRulesEngineConditions = {} as AllRulesEngineConditions;
      if(createConditionsForEntity(entityCondition, (condition as Condition).entity)) {
        rule[RulesEngineConditionalOperators.AND].push(entityCondition);
      }
    }
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
    } else {
      let attributeCondition: AllRulesEngineConditions = {} as AllRulesEngineConditions;
      if(createConditionsForAttribute(ruleInfo, attributeCondition, (condition as Condition).relationship)) {
        rule[RulesEngineConditionalOperators.AND].push(attributeCondition);
      }
    }
  }

  function createConditionsForEntity(rule: AllRulesEngineConditions, entity: Entity): boolean {
    switch(entity.entity_type) {
      case EntityTypes.ASSET_TYPE:
        let assets = getAllAssetsForType(entity.id);
        if(assets.length <= 0) {
          return false;
        }
        rule[RulesEngineConditionalOperators.OR] = []
        for(let asset in Object.keys(assets)) {
          let entityCondition: RulesEngineCondition = {
            fact: "id",
            operator: "equal",
            value: assets[asset].id
          };
          rule[RulesEngineConditionalOperators.OR].push(entityCondition);
        }
        return true;
      case EntityTypes.AREA_TYPE:
        let areas = getAllAreasForType(entity.id);
        if(areas.length <= 0) {
          return false;
        }
        rule[RulesEngineConditionalOperators.OR] = []
        for(let area in Object.keys(areas)) {
          let entityCondition: RulesEngineCondition = {
            fact: "id",
            operator: "equal",
            value: areas[area].id
          };
          rule[RulesEngineConditionalOperators.OR].push(entityCondition);
        }
        return true;
      default:
        return false;
    }
  }

  function createConditionsForAttribute(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, relationship: Relationship): boolean {
    switch(relationship.attribute_type) {
      case EntityTypes.ASSET_TYPE:
        let assets = getAllAssetsForType(relationship.attribute);
        if(assets.length <= 0) {
          return false;
        }
        rule[RulesEngineConditionalOperators.OR] = []
        let rval: OperatorAndValue = GetOperatorAndValue(relationship.operator, relationship.value)
        for(let asset in Object.keys(assets)) {
          AddDuration(ruleInfo.id, ruleInfo.id, assets[asset].id, relationship.duration);
          let attributeCondition: RulesEngineCondition = {
            fact: assets[asset].id,
            operator: rval.operator,
            value: rval.value
          };
          rule[RulesEngineConditionalOperators.OR].push(attributeCondition);
        }
        return true;
      case EntityTypes.AREA_TYPE:
        let areas = getAllAreasForType(relationship.attribute);
        if(areas.length <= 0) {
          return false;
        }
        rule[RulesEngineConditionalOperators.OR] = []
        let rval2: OperatorAndValue = GetOperatorAndValue(relationship.operator, relationship.value)
        for(let area in Object.keys(areas)) {
          AddDuration(ruleInfo.id, ruleInfo.id, areas[area].id, relationship.duration);
          let attributeCondition: RulesEngineCondition = {
            fact: areas[area].id,
            operator: rval2.operator,
            value: rval2.value
          };
          rule[RulesEngineConditionalOperators.OR].push(attributeCondition);
        }
        return true;
      default:
        return false;
    }
  }

  function getAllAssetsForType(assetType: string): any[] {
    let rval = [];
    let collection = ClearBlade.Collection({collectionName: "assets"});
    let query = ClearBlade.Query();
    query.equalTo("type", assetType);
    collection.fetch(query, function(err, data) {
      if(err) {
        log("Error getting all assets for asset_type " + assetType + ": " + JSON.stringify(data));
      } else {
        rval = data.DATA;
      }
    });
    return rval;
  }

  function getAllAreasForType(areaType: string): any[] {
    let rval = [];
    let collection = ClearBlade.Collection({collectionName: "areas"});
    let query = ClearBlade.Query();
    query.equalTo("type", areaType);
    collection.fetch(query, function(err, data) {
      if(err) {
        log("Error getting all areas for area_type " + areaType + ": " + JSON.stringify(data));
      } else {
        rval = data.DATA;
      }
    });
    return rval;
  }
