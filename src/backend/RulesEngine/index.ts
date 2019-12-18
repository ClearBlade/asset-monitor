import "./promise-polyfill"
import "core-js/features/map"
import { Engine } from 'json-rules-engine'
import {
  AllConditions, 
  Rule,
  AllRulesEngineConditions,
  RulesEngineEvent,
  TimeFrame,
  Params,
  RuleInfo,
} from './types'
import { ParseAndConvertConditions } from "./convert-rule"
import { DoesTimeframeMatchRule } from "./timeframe"
import { FireEventsAndActions } from "./events"
import { ProcessDurationIfExists } from "./duration"

export class RulesEngine {
  engine: Engine
  data: object
  constructor() {
    Number.parseFloat = parseFloat;
    let options = {
      allowUndefinedFacts: true
    };
    this.engine = new Engine([], options)
    this.data = {}
  }

  addRule(rule): void {
    this.engine.addRule(rule);
  }

  convertRule(ruleData: object): Rule {
    let name: string = ruleData.label;
    let conditions: AllConditions = JSON.parse(ruleData.conditions);
    let timeframe: TimeFrame = undefined;
    let actionIDs: Array<string> = [];
    if(ruleData.timeframe !== "") {
      timeframe = JSON.parse(ruleData.timeframe);
    }
    if(ruleData["action_ids"] !== "") {
      actionIDs = JSON.parse(ruleData["action_ids"]);
    }
    let rule: Rule = {
      name: name,
      conditions: {} as AllRulesEngineConditions,
      event: {
        type: name,
        params: {
          eventTypeID: ruleData["event_type_id"],
          actionIDs: actionIDs,
          priority: ruleData.priority,
          severity: ruleData.severity,
          timeframe: timeframe,
          ruleID: ruleData["id"],
          ruleName: name,
        }
      } as RulesEngineEvent
    };
    let ruleInfo: RuleInfo = {
      name: name,
      id: ruleData["id"]
    };
    ParseAndConvertConditions(ruleInfo, rule.conditions, conditions);
    return rule;
  }

  run(facts) {
    let resp = "";
    this.engine.run(facts)
      .then(results => {
        resp = results;
        processRuleResults(results.events[0], facts);
      }, (err) => {
        resp = err.message
      });
    Promise.runQueue();
    return resp;
  }
}

function processRuleResults(event, facts): void {
  if(event === undefined) { // rule failed
    log("Rule failed");
    return;
  }
  let params: Params = event.params as Params;
  if(params.timeframe !== undefined) {
    if(!DoesTimeframeMatchRule(params.timeframe)) {
      log("Cannot run rule because timeframe constraints failed: " + event.type);
      return;
    }
  }
  FireEventsAndActions(params);
  log("Rule success " + JSON.stringify(event) + " and " + JSON.stringify(facts));
}
