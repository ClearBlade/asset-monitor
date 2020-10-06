import { RuleParams, Entities, SplitEntities, WithParsedCustomData } from './types';
import '@clearblade/promise-polyfill';
import {
    getActionByID,
    getStateForEvent,
    createEvent,
    createEventHistoryItem,
    shouldCreateOrUpdateEvent,
    closeRules,
} from './async';
import * as uuid from 'uuid/v4';
import { EventSchema } from '../collection-schema/Events';
import { Areas } from '../collection-schema/Areas';
import { doesTimeframeMatchRule } from './timeframe';

export function processSuccessfulEvent(
    ids: string[],
    ruleParams: RuleParams,
    entities: Entities,
    actionTopic: string,
    trigger: WithParsedCustomData,
): void {
    if (doesTimeframeMatchRule(new Date().toISOString(), ruleParams.timeframe)) {
        const filteredEntities = ids.reduce((acc: Entities, id: string) => {
            acc[id] = entities[id];
            return acc;
        }, {});
        processEvent(ruleParams, filteredEntities, actionTopic, trigger);
    }
}

function getSplitEntities(entities: Entities): SplitEntities {
    return Object.keys(entities).reduce(
        (acc, id) => {
            if ((entities[id] as Areas).polygon) {
                acc.areas[id] = {
                    ...entities[id],
                    image: ''
                 }
            } else {
                acc.assets[id] = {
                    ...entities[id],
                    image: ''
                 }
            }
            return acc;
        },
        {
            assets: {} as Entities,
            areas: {} as Entities,
        },
    );
}

export function getDefaultTimestamp(): string {
    return new Date().toISOString();
}

export function processEvent(
    ruleParams: Omit<RuleParams, 'ruleType' | 'ruleName'> & { timestamp?: string },
    entities: Entities,
    actionTopic: string,
    trigger: WithParsedCustomData,
): Promise<EventSchema | void> {
    const { eventTypeID, actionIDs, priority, severity, ruleID, closesIds } = ruleParams;
    const splitEntities = getSplitEntities(entities);
    const promise = closeRules(closesIds, splitEntities).then(shouldProceed => {
        if (shouldProceed) {
            const promise = shouldCreateOrUpdateEvent(ruleID, splitEntities).then(shouldCreate => {
                if (shouldCreate) {
                    const promise = getStateForEvent(eventTypeID).then(({ is_open, state }) => {
                        const id = uuid();
                        const timestamp = ruleParams.timestamp ? ruleParams.timestamp : getDefaultTimestamp();
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
                                    for (let i = 0; i < actionIDs.length; i++) {
                                        performAction(actionIDs[i], item, actionTopic, trigger);
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
    });
    Promise.runQueue();
    return promise;
}

function performAction(
    actionId: string,
    event: EventSchema,
    actionTopic: string,
    triggerMessage: WithParsedCustomData,
): void {
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
