import { RuleParams } from './types';
import { ActionTypes } from '../collection-schema/Actions';
import '../../static/promise-polyfill';
import { Event } from 'json-rules-engine';
import { Areas } from '../collection-schema/Areas';
import { Asset } from '../collection-schema/Assets';
import { getActionByID, getOpenStateForEvent, createEvent } from './async';
import * as uuid from 'uuid/v4';
import { EventSchema } from '../collection-schema/Events';

export interface Entities {
    [x: string]: Asset | Areas;
}

function getSplitEntities(entities: Entities) {
    return Object.keys(entities).reduce((acc, id) => {
        if (entities[id].hasOwnProperty('polygon')) {
            acc.areas[id] = entities[id];
        } else {
            acc.assets[id] = entities[id];
        }
        return acc;
    }, {
        assets: {} as Entities,
        areas: {} as Entities
    })
}

export function processEvent(event: Event, entities: Entities, actionTopic: string): Promise<EventSchema> {
    const { eventTypeID, actionIDs, priority, severity, ruleID } = event.params as RuleParams
    const promise = getOpenStateForEvent(eventTypeID).then((state) => {
        const id = uuid();
        const splitEntities = getSplitEntities(entities);
        const item = {
            last_updated: new Date().toISOString(),
            is_open: true,
            label: `${eventTypeID}_${id}`,
            severity,
            id,
            type: eventTypeID,
            state: state || 'Open',
            priority,
            action_ids: JSON.stringify(actionIDs || []),
            rule_id: ruleID,
            assets: JSON.stringify(splitEntities.assets),
            areas: JSON.stringify(splitEntities.areas)
        }
        const promise = createEvent(item).then(() => {
            if (!!actionTopic) {
                for (let i = 0; i < (event.params as RuleParams).actionIDs.length; i++) {
                    performAction((event.params as RuleParams).actionIDs[i], item, actionTopic);
                }
            }
            return item;
        })
        Promise.runQueue();
        return promise;
    })
    Promise.runQueue();
    return promise;
}

function performAction(actionId: string, event: EventSchema, actionTopic: string): void {
    getActionByID(actionId).then(function(action) {
        const messaging = ClearBlade.Messaging();
        messaging.publish(actionTopic, JSON.stringify({
            action,
            event
        }))
    })
    Promise.runQueue();
}
