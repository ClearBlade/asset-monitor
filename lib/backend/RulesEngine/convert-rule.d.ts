<<<<<<< HEAD
import { AllConditions, AllRulesEngineConditions, RuleInfo } from './types';
<<<<<<< HEAD
<<<<<<< HEAD
import '../../static/promise-polyfill';
export declare function ParseAndConvertConditions(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, conditions: AllConditions): void;
=======
import "../../static/promise-polyfill";
=======
import '../../static/promise-polyfill';
>>>>>>> type and lint errors
export declare function ParseAndConvertConditions(ruleInfo: RuleInfo, rule: AllRulesEngineConditions, conditions: AllConditions): Promise<AllRulesEngineConditions>;
>>>>>>> promisify convert-rule, add mocks, fix test
=======
import { Conditions } from './types';
import '../../static/promise-polyfill';
import { TopLevelCondition, AnyConditions, AllConditions } from 'json-rules-engine';
export declare function ParseAndConvertConditions(id: string, conditions: Conditions): Promise<TopLevelCondition | AnyConditions | AllConditions>;
>>>>>>> refactor conversions to include engine library types
