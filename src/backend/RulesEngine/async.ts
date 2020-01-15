import { CbCollectionLib } from '../collection-lib';
import { CollectionName } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { Areas } from '../collection-schema/Areas';
import { Actions } from '../collection-schema/Actions';
import { EventType } from '../collection-schema/Events';

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

export function getActionByID(actionID: string): Promise<Actions> {
    const actionsCollection = CbCollectionLib(CollectionName.ACTIONS);
    const actionsCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.ACTIONS }).equalTo('id', actionID);

    const promise = actionsCollection.cbFetchPromise({ query: actionsCollectionQuery }).then(data => {
        return Array.isArray(data.DATA) && data.DATA[0] ? data.DATA[0] : {};
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
