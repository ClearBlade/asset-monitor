import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Event, RuleProperties, EngineResult, TopLevelCondition } from 'json-rules-engine';
import { Params } from './types';
import { ParseAndConvertConditions } from './convert-rule';
import { DoesTimeframeMatchRule } from './timeframe';
import { FireEventsAndActions } from './events';
// import { ProcessDurationIfExists } from './duration';
import { Rules } from '../collection-schema/Rules';

function processRuleResults(events: Event[], facts: Record<string, string | number | boolean>, timestamp: string): void {
    if (events.length > 0) {
        for (let i = 0; i < events.length; i++) {
            if (!!events[i]) {
                const params = events[i].params as Params;
                if (DoesTimeframeMatchRule(timestamp, params.timeframe)) {
                    // log('Cannot run rule because timeframe constraints failed: ' + event.type);
                    FireEventsAndActions(events[i]);
                }
            }
        }
        
    // log('Rule success ' + JSON.stringify(event) + ' and ' + JSON.stringify(facts));
    }
    // rule failed
    // log('Rule failed');
    console.log('facts', facts);
    return;
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

    async convertRule(ruleData: Rules): Promise<RuleProperties> {
        const { label, event_type_id, priority, severity, id, timeframe, action_ids, conditions } = ruleData;
        
        const parsedConditions = JSON.parse(conditions || '{}');
        const parsedTimeframe = !!timeframe ? JSON.parse(timeframe) : timeframe;
        const parsedActionIDs = !!action_ids ? JSON.parse(action_ids) : action_ids;

        const promise = ParseAndConvertConditions(id, parsedConditions).then(
            (convertedConditions: TopLevelCondition) => {
                return {
                    name: id,
                    conditions: convertedConditions,
                    event: {
                        type: label,
                        params: {
                            eventTypeID: event_type_id,
                            actionIDs: parsedActionIDs,
                            priority,
                            severity,
                            timeframe: parsedTimeframe,
                            ruleID: id,
                            ruleName: label,
                        },
                    },
                };
            },
        );
        Promise.runQueue();
        return promise;
    }

    async run(facts: Record<string, string | number | boolean>, timestamp: string): Promise<EngineResult> {
        const promise = this.engine.run(facts).then(
            results => {
                processRuleResults(results.events, facts, timestamp);
                return results;
            },
            err => err.message,
        );
        Promise.runQueue();
        return promise;
    }
}
