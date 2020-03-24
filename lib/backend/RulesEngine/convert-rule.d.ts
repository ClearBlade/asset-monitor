import { Conditions } from './types';
import '../../static/promise-polyfill';
import { TopLevelCondition, AnyConditions, AllConditions, ConditionProperties } from 'json-rules-engine';
export declare function parseAndConvertConditions(conditions: Conditions): Promise<TopLevelCondition | AnyConditions | AllConditions | ConditionProperties>;
