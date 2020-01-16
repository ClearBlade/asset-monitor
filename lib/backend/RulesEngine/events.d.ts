import '../../static/promise-polyfill';
import { Event } from 'json-rules-engine';
import { Entities } from './async';
import { EventSchema } from '../collection-schema/Events';
export declare function processEvent(event: Event, entities: Entities, actionTopic: string, trigger: Entities): Promise<EventSchema>;
