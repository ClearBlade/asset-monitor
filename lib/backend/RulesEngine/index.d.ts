import { Rules } from "../collection-schema/Rules";
interface RulesEngineAPI {
    resp: CbServer.Resp;
    rules: Rules[];
    incomingDataTopics: string[];
}
export declare function rulesEngineApi({ resp, rules, incomingDataTopics }: RulesEngineAPI): void;
export {};
