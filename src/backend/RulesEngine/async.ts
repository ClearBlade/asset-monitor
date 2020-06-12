import { CbCollectionLib } from '../collection-lib';
import { CollectionName } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { Areas } from '../collection-schema/Areas';
import { Actions } from '../collection-schema/Actions';
import { EventType, EventSchema } from '../collection-schema/Events';
import { Entities, SplitEntities } from './types';
import { uniqueArray } from './utils';
import { Rules } from '../collection-schema/Rules';

export function getAllAssetsForType(assetType: string): Promise<Array<CbServer.CollectionSchema<Asset>>> {
    const assetsCollection = CbCollectionLib(CollectionName.ASSETS);
    const assetsCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS });
    assetsCollectionQuery.equalTo('type', assetType);

    const promise = assetsCollection.cbFetchPromise({ query: assetsCollectionQuery }).then(data => {
        return Array.isArray(data.DATA) ? data.DATA : [];
    });
    Promise.runQueue();
    return promise;
}

export function getAllAreasForType(areaType: string): Promise<Array<CbServer.CollectionSchema<Areas>>> {
    const areasCollection = CbCollectionLib(CollectionName.AREAS);
    const areasCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.AREAS });
    areasCollectionQuery.equalTo('type', areaType);

    const promise = areasCollection.cbFetchPromise({ query: areasCollectionQuery }).then(data => {
        return Array.isArray(data.DATA) ? data.DATA : [];
    });
    Promise.runQueue();
    return promise;
}

export function getAllAssets(): Promise<Array<CbServer.CollectionSchema<Asset>>> {
    const assetsCollection = CbCollectionLib(CollectionName.ASSETS);
    const assetsCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS });

    const promise = assetsCollection.cbFetchPromise({ query: assetsCollectionQuery }).then(data => {
        return Array.isArray(data.DATA) ? data.DATA : [];
    });
    Promise.runQueue();
    return promise;
}

export function getAllAreas(): Promise<Array<CbServer.CollectionSchema<Areas>>> {
    const areasCollection = CbCollectionLib(CollectionName.AREAS);
    const areasCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.AREAS });

    const promise = areasCollection.cbFetchPromise({ query: areasCollectionQuery }).then(data => {
        return Array.isArray(data.DATA) ? data.DATA : [];
    });
    Promise.runQueue();
    return promise;
}

export function getActionByID(actionID: string): Promise<Actions> {
    const actionsCollection = CbCollectionLib(CollectionName.ACTIONS);
    const actionsCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.ACTIONS }).equalTo('id', actionID);

    const promise = actionsCollection.cbFetchPromise({ query: actionsCollectionQuery }).then(data => {
        return Array.isArray(data.DATA) && data.DATA[0] ? data.DATA[0] : {};
    });
    Promise.runQueue();
    return promise;
}

function compareAssetsOrAreas(oldEntities: Entities, newEntities: Entities): boolean | string[] {
    const oldKeys = uniqueArray(Object.keys(oldEntities));
    const newKeys = uniqueArray(Object.keys(newEntities));
    const additions = [];
    let hasOverlap = false;
    if (oldKeys.length && newKeys.length) {
        for (let i = 0; i < newKeys.length; i++) {
            const oldIndex = oldKeys.indexOf(newKeys[i]);
            if (oldIndex > -1) {
                oldKeys.splice(oldIndex, 1);
                hasOverlap = true;
            } else {
                additions.push(newKeys[i]);
            }
        }

        if (!oldKeys.length && !additions.length) {
            return true; // all ids are overlapping - do nothing
        } else if (hasOverlap) {
            return additions; // need to update existing event with additions
        }
    }
    return false; // no items in old or new OR no overlaps - need to keep looking or make new event
}

function aggregateEntities(newEntities: Entities, oldEntities: Entities): Entities {
    return {
        ...oldEntities,
        ...newEntities,
    };
}

export function compareOverlappingEntities(event: EventSchema, splitEntities: SplitEntities): boolean | SplitEntities {
    const existingAssets = JSON.parse(event.assets || '{}');
    const existingAreas = JSON.parse(event.areas || '{}');

    const assetAdditions = compareAssetsOrAreas(existingAssets, splitEntities.assets);
    const areaAdditions = compareAssetsOrAreas(existingAreas, splitEntities.areas);
    if (
        Array.isArray(assetAdditions) ||
        Array.isArray(areaAdditions) ||
        (assetAdditions && !areaAdditions) ||
        (!assetAdditions && areaAdditions)
    ) {
        return {
            assets: aggregateEntities(splitEntities.assets, existingAssets),
            areas: aggregateEntities(splitEntities.areas, existingAreas),
        };
    }
    return assetAdditions && areaAdditions;
}

function updateEvent(id: string, entities: SplitEntities): void {
    const eventsCollection = CbCollectionLib(CollectionName.EVENTS);
    const query = ClearBlade.Query().equalTo('id', id);
    const changes = {
        assets: entities.assets,
        areas: entities.areas,
    };
    eventsCollection.cbUpdatePromise({ query, changes });
}

export function shouldCreateOrUpdateEvent(ruleID: string, splitEntities: SplitEntities): Promise<boolean> {
    // if overlapping entities with existing event for rule, then update with added entities or do nothing if none added, else create new
    const eventsCollection = CbCollectionLib(CollectionName.EVENTS);
    const query = ClearBlade.Query({ collectionName: CollectionName.EVENTS })
        .equalTo('rule_id', ruleID)
        .equalTo('is_open', true);

    const promise = eventsCollection
        .cbFetchPromise({ query })
        .then((data: CbServer.CollectionFetchData<EventSchema>) => {
            const openEvents = data.DATA;
            for (let i = 0; i < openEvents.length; i++) {
                const hasOverlappingEntities = compareOverlappingEntities(openEvents[i], splitEntities);
                if (hasOverlappingEntities) {
                    if (typeof hasOverlappingEntities === 'object') {
                        updateEvent(openEvents[i].id as string, hasOverlappingEntities);
                    }
                    return false;
                }
            }
            return true;
        });
    Promise.runQueue();
    return promise;
}

export interface EventState {
    is_open: boolean;
    state: string;
}

export function getStateForEvent(eventTypeId: string): Promise<EventState> {
    const eventTypesCollection = CbCollectionLib(CollectionName.EVENT_TYPES);
    const eventTypesCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.EVENT_TYPES }).equalTo(
        'id',
        eventTypeId,
    );

    const promise = eventTypesCollection
        .cbFetchPromise({ query: eventTypesCollectionQuery })
        .then((data: CbServer.CollectionFetchData<EventType>) => {
            const typeData = Array.isArray(data.DATA) && data.DATA[0];
            if (typeData && !!typeData.has_lifecycle) {
                const openState = JSON.parse((typeData.open_states as string) || '[]')[0];
                if (openState) {
                    return { is_open: true, state: openState };
                }
                const closedState = JSON.parse((typeData.closed_states as string) || '[]')[0];
                if (closedState) {
                    return { is_open: false, state: closedState };
                }
            }
            return {
                is_open: false,
                state: '',
            };
        });
    Promise.runQueue();
    return promise;
}

export function createEvent(item: Record<string, string | boolean | number>): Promise<{ item_id: string }[]> {
    const eventsCollection = CbCollectionLib(CollectionName.EVENTS);
    return eventsCollection.cbCreatePromise({ item });
}

export function createEventHistoryItem(
    item: Record<string, string | boolean | number>,
): Promise<{ item_id: string }[]> {
    const eventHistoryCollection = CbCollectionLib(CollectionName.EVENT_HISTORY);
    return eventHistoryCollection.cbCreatePromise({ item });
}

export function closeRules(ids: string[], splitEntities: SplitEntities): Promise<boolean> {
    if (ids.length) {
        let shouldProceed = false;
        const promise = Promise.all(
            ids.map(id => {
                const rulesCollection = CbCollectionLib(CollectionName.RULES);
                const query = ClearBlade.Query().equalTo('id', id);
                const promise = rulesCollection
                    .cbFetchPromise({ query })
                    .then((data: CbServer.CollectionFetchData<Rules>) => {
                        const state = JSON.parse(data.DATA[0].closed_by_rule || '{}').state;
                        const eventsCollection = CbCollectionLib(CollectionName.EVENTS);
                        const query = ClearBlade.Query()
                            .equalTo('rule_id', id)
                            .equalTo('is_open', true);
                        const promise = eventsCollection
                            .cbFetchPromise({ query })
                            .then((data: CbServer.CollectionFetchData<EventSchema>) => {
                                for (let i = 0; i < data.DATA.length; i++) {
                                    const hasOverlappingEntities = compareOverlappingEntities(
                                        data.DATA[i],
                                        splitEntities,
                                    );
                                    if (hasOverlappingEntities) {
                                        shouldProceed = true;
                                        const query = ClearBlade.Query().equalTo('id', data.DATA[i].id as string);
                                        return eventsCollection.cbUpdatePromise({
                                            query,
                                            changes: { state, is_open: false },
                                        });
                                    }
                                }
                            });
                        Promise.runQueue();
                        return promise;
                    });
                Promise.runQueue();
                return promise;
            }),
        ).then(() => {
            return shouldProceed;
        });
        Promise.runQueue();
        return promise;
    }
    return new Promise(res => res(true));
}
