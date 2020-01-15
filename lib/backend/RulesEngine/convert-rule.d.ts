import { Conditions } from './types';
import '../../static/promise-polyfill';
import { TopLevelCondition, AnyConditions, AllConditions } from 'json-rules-engine';
export declare function parseAndConvertConditions(ruleId: string, conditions: Conditions): Promise<TopLevelCondition | AnyConditions | AllConditions>;
