import { RuleParams, Entities, WithParsedCustomData } from './types';
import '@clearblade/promise-polyfill';
import { EventSchema } from '../collection-schema/Events';
export declare function processSuccessfulEvent(ids: string[], ruleParams: RuleParams, entities: Entities, actionTopic: string, trigger: WithParsedCustomData): void;
export declare function getDefaultTimestamp(): string;
export declare function processEvent(ruleParams: Omit<RuleParams, 'ruleType' | 'ruleName'> & {
    timestamp?: string;
}, entities: Entities, actionTopic: string, trigger: WithParsedCustomData): Promise<EventSchema | void>;
