import { Rules } from "../collection-schema/Rules";
interface RulesEngineAPI {
    resp: CbServer.Resp;
    fetchRulesForEngine: () => Promise<Rules[]>;
    incomingDataTopics: string[];
    actionTopic: string;
}
export declare function rulesEngineSS({ resp, incomingDataTopics, fetchRulesForEngine, actionTopic }: RulesEngineAPI): void;
export {};
