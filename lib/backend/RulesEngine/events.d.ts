import { RuleParams } from './types';
import '../../static/promise-polyfill';
import { Entities } from './async';
import { EventSchema } from '../collection-schema/Events';
export declare function processSuccessfulEvents(combinations: Array<string[]>, ruleParams: RuleParams, entities: Entities, actionTopic: string, trigger: Entities): void;
export declare function processEvent(ruleParams: RuleParams, entities: Entities, actionTopic: string, trigger: Entities): Promise<EventSchema>;
