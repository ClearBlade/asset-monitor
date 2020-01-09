import '../../static/promise-polyfill';
import { Event } from 'json-rules-engine';
import { Areas } from '../collection-schema/Areas';
import { Asset } from '../collection-schema/Assets';
import { EventSchema } from '../collection-schema/Events';
export interface Entities {
    [x: string]: Asset | Areas;
}
export declare function processEvent(event: Event, entities: Entities, actionTopic: string): Promise<EventSchema>;
