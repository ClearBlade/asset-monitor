import { Rules } from "../collection-schema/Rules";
interface RulesEngineAPI {
    resp: CbServer.Resp;
    fetchRulesForEngine: () => Promise<Rules[]>;
    incomingDataTopics: string[];
}
export declare function rulesEngineSS({ resp, incomingDataTopics, fetchRulesForEngine }: RulesEngineAPI): void;
export {};
