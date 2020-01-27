import { RuleParams } from './types';
import '../../static/promise-polyfill';
import {
    getActionByID,
    getStateForEvent,
    createEvent,
    createEventHistoryItem,
    Entities,
    shouldCreateEvent,
    SplitEntities,
} from './async';
import * as uuid from 'uuid/v4';
import { EventSchema } from '../collection-schema/Events';
import { Areas } from '../collection-schema/Areas';
import { doesTimeframeMatchRule } from './timeframe';

export function processSuccessfulEvents(
    combinations: Array<string[]>,
    ruleParams: RuleParams,
    entities: Entities,
    actionTopic: string,
    trigger: Entities,
): void {
    if (doesTimeframeMatchRule(new Date().toISOString(), ruleParams.timeframe)) {
        for (let i = 0; i < combinations.length; i++) {
            const filteredEntities = combinations[i].reduce((acc: Entities, id: string) => {
                acc[id] = entities[id];
                return acc;
            }, {});
            processEvent(ruleParams, filteredEntities, actionTopic, trigger);
        }
    }
}

function getSplitEntities(entities: Entities): SplitEntities {
    return Object.keys(entities).reduce(
        (acc, id) => {
            if ((entities[id] as Areas).polygon) {
                acc.areas[id] = entities[id];
            } else {
                acc.assets[id] = entities[id];
            }
            return acc;
        },
        {
            assets: {} as Entities,
            areas: {} as Entities,
        },
    );
}

export function processEvent(
    ruleParams: RuleParams,
    entities: Entities,
    actionTopic: string,
    trigger: Entities,
): Promise<EventSchema> {
    const { eventTypeID, actionIDs, priority, severity, ruleID } = ruleParams;
    const splitEntities = getSplitEntities(entities);
    const promise = shouldCreateEvent(ruleID, splitEntities).then(should => {
        if (should) {
            const promise = getStateForEvent(eventTypeID).then(({ is_open, state }) => {
                const id = uuid();
                const timestamp = new Date().toISOString();
                const item = {
                    last_updated: timestamp,
                    is_open,
                    label: `${eventTypeID}_${id}`,
                    severity,
                    id,
                    type: eventTypeID,
                    state,
                    priority,
                    action_ids: JSON.stringify(actionIDs || []),
                    rule_id: ruleID,
                    assets: JSON.stringify(splitEntities.assets),
                    areas: JSON.stringify(splitEntities.areas),
                };
                const promise = createEvent(item).then(() => {
                    const promise = createEventHistoryItem({
                        event_id: id,
                        timestamp,
                        transition_value: state,
                        transition_attribute: 'state',
                    }).then(() => {
                        if (actionTopic) {
                            for (let i = 0; i < ruleParams.actionIDs.length; i++) {
                                performAction(ruleParams.actionIDs[i], item, actionTopic, trigger);
                            }
                        }
                        return item;
                    });
                    Promise.runQueue();
                    return promise;
                });
                Promise.runQueue();
                return promise;
            });
            Promise.runQueue();
            return promise;
        } else {
            return {};
        }
    });
    Promise.runQueue();
    return promise;
}

function performAction(actionId: string, event: EventSchema, actionTopic: string, triggerMessage: Entities): void {
    getActionByID(actionId).then(function(action) {
        const messaging = ClearBlade.Messaging();
        messaging.publish(
            actionTopic,
            JSON.stringify({
                action,
                event,
                triggerMessage,
            }),
        );
    });
    Promise.runQueue();
}
