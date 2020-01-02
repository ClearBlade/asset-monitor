import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, RuleProperties, EngineResult } from 'json-rules-engine';
import { Rules } from '../collection-schema/Rules';
export declare class RulesEngine {
    engine: Engine;
    data: object;
    constructor();
    addRule(rule: RuleProperties): void;
    convertRule(ruleData: Rules): Promise<RuleProperties>;
    run(facts: Record<string, string | number | boolean>, timestamp: string): Promise<EngineResult>;
}
