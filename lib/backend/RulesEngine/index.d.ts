import { Rules } from '../collection-schema/Rules';
declare type RulesWithExternalInfo = Rules & {
    is_external: boolean;
};
interface RulesEngineAPI {
    resp: CbServer.Resp;
    fetchRulesForEngine: () => Promise<RulesWithExternalInfo[]>;
    incomingDataTopics: string[];
    actionTopic: string;
}
export declare function rulesEngineSS({ resp, incomingDataTopics, fetchRulesForEngine, actionTopic }: RulesEngineAPI): void;
export {};
