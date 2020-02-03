import { RuleParams } from './types';
import { TopLevelCondition } from 'json-rules-engine';
import { Entities } from './async';
import { FactData, ProcessedCondition } from './utils';
export declare function processDurations(validCombinations: Array<ProcessedCondition[]>, conditions: TopLevelCondition, ruleParams: RuleParams, entities: Entities, actionTopic: string, incomingData: FactData): void;
