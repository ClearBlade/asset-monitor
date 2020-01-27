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
export declare function aggregateFactMap(almanac: Almanac, conditionIds: Array<string[]>): Entities;
interface ProcessedRule {
    conditionIds: Array<string[]>;
    hasDuration: boolean;
    hasSuccessfulResult: boolean;
    numValidCombination: number;
}
export declare function processRule(conditions: Array<TopLevelCondition | ConditionProperties>, processedRule: ProcessedRule, parentOperator: 'any' | 'all'): ProcessedRule;
export {};
