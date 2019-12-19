import "../../static/promise-polyfill";
import "core-js/features/map";
import { Engine, RuleProperties } from "json-rules-engine";
import { Rule } from "./types";
import { Rules } from "../collection-schema/Rules";
export declare class RulesEngine {
    engine: Engine;
    data: object;
    constructor();
    addRule(rule: RuleProperties): void;
    convertRule(ruleData: Rules): Rule;
    run(facts: Record<string, any>): void;
}
