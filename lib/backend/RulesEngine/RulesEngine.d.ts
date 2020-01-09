import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Rule } from 'json-rules-engine';
import { Rules } from '../collection-schema/Rules';
interface IncomingFact {
    incomingData: {
        id: string;
        [x: string]: string | number | boolean | object;
    };
}
export declare class RulesEngine {
    engine: Engine;
    rules: {
        [id: string]: Rule;
    };
    actionTopic: string;
    constructor(actionTopic: string);
    addRule(ruleData: Rules): Promise<Rule>;
    editRule(id: string, ruleData: Rules): void;
    deleteRule(id: string): void;
    convertRule(ruleData: Rules): Promise<Rule>;
    run(fact: IncomingFact): Promise<string>;
}
export {};
