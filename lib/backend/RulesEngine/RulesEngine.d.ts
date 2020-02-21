import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Event, Almanac, RuleResult, Rule } from 'json-rules-engine';
import { WithParsedCustomData } from './types';
import { Rules } from '../collection-schema/Rules';
import { DurationEngine } from './DurationEngine';
interface IncomingFact {
    incomingData: WithParsedCustomData;
}
export declare class RulesEngine {
    engine: Engine;
    durationEngine: DurationEngine;
    rules: {
        [id: string]: Rule;
    };
    actionTopic: string;
    constructor(actionTopic: string);
    addRule(ruleData: Rules): Promise<Rule>;
    editRule(ruleData: Rules): void;
    deleteRule(id: string): void;
    clearRules(): void;
    convertRule(ruleData: Rules): Promise<Rule>;
    run(fact: IncomingFact): Promise<string>;
    handleRuleFinished(event: Event, almanac: Almanac, ruleResult: RuleResult, actionTopic: string): void;
}
export {};
