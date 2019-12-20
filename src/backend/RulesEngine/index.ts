import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Event, RuleProperties } from 'json-rules-engine';
import { AllConditions, Rule, AllRulesEngineConditions, RulesEngineEvent, TimeFrame, Params, RuleInfo } from './types';
import { ParseAndConvertConditions } from './convert-rule';
import { DoesTimeframeMatchRule } from './timeframe';
import { FireEventsAndActions } from './events';
import { ProcessDurationIfExists } from './duration';
import { Rules } from '../collection-schema/Rules';

// @ts-ignore
const log: { (s: any): void } = global.log;

export class RulesEngine {
    engine: Engine;
    data: object;
    constructor() {
        Number.parseFloat = parseFloat;
        const options = {
            allowUndefinedFacts: true,
        };
        this.engine = new Engine([], options);
        this.data = {};
    }

    addRule(rule: RuleProperties): void {
        this.engine.addRule(rule);
    }

    convertRule(ruleData: Rules): Promise<Rule> {
        const name: string = ruleData.label;
        const conditions: AllConditions = JSON.parse(ruleData.conditions);
        let timeframe;
        let actionIDs: Array<string> = [];
        if (ruleData.timeframe !== '') {
            timeframe = JSON.parse(ruleData.timeframe);
        }
        if (ruleData['action_ids'] !== '') {
            actionIDs = JSON.parse(ruleData['action_ids']);
        }
        const rule: Rule = {
            name: name,
            conditions: {} as AllRulesEngineConditions,
            event: {
                type: name,
                params: {
                    eventTypeID: ruleData['event_type_id'],
                    actionIDs: actionIDs,
                    priority: ruleData.priority,
                    severity: ruleData.severity,
                    timeframe: timeframe,
                    ruleID: ruleData['id'],
                    ruleName: name,
                },
            } as RulesEngineEvent,
        };
        const ruleInfo: RuleInfo = {
            name: name,
            id: ruleData['id'],
        };
        const promise = ParseAndConvertConditions(ruleInfo, rule.conditions, conditions).then((convertedConditions: AllRulesEngineConditions) => {
          return {
            ...rule,
            conditions: convertedConditions
          }
        });
        // @ts-ignore
        Promise.runQueue();
        return promise;
    }

    run(facts: Record<string, any>) {
        this.engine.run(facts).then(
            results => {
                processRuleResults(results.events[0], facts);
                return results;
            },
            err => err.message,
        );
        // @ts-ignore
        Promise.runQueue();
    }
}

function processRuleResults(event: Event, facts: Record<string, any>): void {
    if (event === undefined) {
        // rule failed
        log('Rule failed');
        return;
    }
    const params: Params = event.params as Params;
    if (params.timeframe !== undefined) {
        if (!DoesTimeframeMatchRule(params.timeframe)) {
            log('Cannot run rule because timeframe constraints failed: ' + event.type);
            return;
        }
    }
    FireEventsAndActions(params);
    log('Rule success ' + JSON.stringify(event) + ' and ' + JSON.stringify(facts));
}
