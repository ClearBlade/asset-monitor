import '../../static/promise-polyfill';
import 'core-js/features/map';
import { Engine, Rule } from 'json-rules-engine';
import { Rules } from '../collection-schema/Rules';
import { Asset } from '../collection-schema/Assets';
interface WithParsedCustomData extends Asset {
    custom_data: Record<string, object>;
}
interface IncomingFact {
    incomingData: WithParsedCustomData;
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
