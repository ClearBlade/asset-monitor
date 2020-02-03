import { Almanac, TopLevelCondition, ConditionProperties } from 'json-rules-engine';
import { Asset } from '../collection-schema/Assets';
import { CollectionName } from '../global-config';
import { Areas } from '../collection-schema/Areas';
import { EntityTypes } from './types';
import { Entities } from './async';
export interface WithParsedCustomData extends Asset {
    custom_data: Record<string, object>;
    entityType?: EntityTypes;
}
export interface FactData {
    data: WithParsedCustomData;
}
export declare function collectAndBuildFact(almanac: Almanac, id: string, type: string, collectionName: CollectionName, incomingData: WithParsedCustomData): Promise<FactData>;
export declare function buildFact(entityData: Asset | Areas, incomingData: WithParsedCustomData): WithParsedCustomData;
export interface ProcessedCondition {
    id: string;
    result: boolean;
    duration: number;
}
declare type ProcessedRule = Array<ProcessedCondition[] | ProcessedCondition>;
export declare type ParentOperator = 'all' | 'any';
export declare function processRule(conditions: Array<TopLevelCondition | ConditionProperties>, parentOperator?: ParentOperator): ProcessedRule;
interface ProcessedFiltered {
    trues: string[];
    pendingDurations: ProcessedRule;
}
export declare function filterProcessedRule(processedRule: Array<ProcessedCondition[]>, triggerId: string, topLevelType: ParentOperator): ProcessedFiltered;
export declare function aggregateFactMap(processedRule: ProcessedFiltered, almanac: Almanac): Entities;
export {};
