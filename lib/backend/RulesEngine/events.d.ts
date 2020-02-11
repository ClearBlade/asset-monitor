import { RuleParams, Entities, WithParsedCustomData } from './types';
import '../../static/promise-polyfill';
import { EventSchema } from '../collection-schema/Events';
export declare function processSuccessfulEvent(ids: string[], ruleParams: RuleParams, entities: Entities, actionTopic: string, trigger: WithParsedCustomData): void;
export declare function processEvent(ruleParams: RuleParams, entities: Entities, actionTopic: string, trigger: WithParsedCustomData): Promise<EventSchema>;
