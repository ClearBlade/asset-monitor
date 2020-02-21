import { Almanac, TopLevelCondition, ConditionProperties } from 'json-rules-engine';
import { CollectionName } from '../global-config';
import { ProcessedCondition, WithParsedCustomData, Entities } from './types';
export interface FactData {
    data: WithParsedCustomData;
}
export declare function collectAndBuildFact(almanac: Almanac, id: string, type: string, collectionName: CollectionName, incomingData: WithParsedCustomData): Promise<FactData>;
declare type ProcessedRule = Array<ProcessedCondition[] | ProcessedCondition>;
export declare type ParentOperator = 'all' | 'any';
export declare function processRule(conditions: Array<TopLevelCondition | ConditionProperties>, parentOperator?: ParentOperator): ProcessedRule;
interface ProcessedFiltered {
    trues: string[];
    pendingDurations: ProcessedRule;
}
export declare function filterProcessedRule(processedRule: Array<ProcessedCondition[]>, triggerId: string): ProcessedFiltered;
export declare function uniqueArray(arr: string[]): string[];
export declare function aggregateFactMap(processedRule: ProcessedFiltered, almanac: Almanac): Entities;
export {};
