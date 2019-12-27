import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Event, RuleProperties, EngineResult } from 'json-rules-engine';
import { AllConditions, Rule, AllRulesEngineConditions, RulesEngineEvent, Params, RuleInfo } from './types';
import { ParseAndConvertConditions } from './convert-rule';
import { DoesTimeframeMatchRule } from './timeframe';
import { FireEventsAndActions } from './events';
// import { ProcessDurationIfExists } from './duration';
import { Rules } from '../collection-schema/Rules';

function processRuleResults(event: Event, facts: Record<string, string>, timestamp: string): void {
    if (event === undefined) {
        // rule failed
        // log('Rule failed');
        console.log('facts', facts);
        return;
    }
    const params = event.params as Params;
    if (params.timeframe !== undefined) {
        if (!DoesTimeframeMatchRule(timestamp, params.timeframe)) {
            // log('Cannot run rule because timeframe constraints failed: ' + event.type);
            return;
        }
    }
    FireEventsAndActions(params);
    // log('Rule success ' + JSON.stringify(event) + ' and ' + JSON.stringify(facts));
}

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
        const promise = ParseAndConvertConditions(ruleInfo, rule.conditions, conditions).then(
            (convertedConditions: AllRulesEngineConditions) => {
                return {
                    ...rule,
                    conditions: convertedConditions,
                };
            },
        );
        Promise.runQueue();
        return promise;
    }

    run(facts: Record<string, string>, timestamp: string): Promise<EngineResult> {
        const promise = this.engine.run(facts).then(
            results => {
                processRuleResults(results.events[0], facts, timestamp);
                return results;
            },
            err => err.message,
        );
        Promise.runQueue();
        return promise;
    }
}
