import { CbCollectionLib } from '../collection-lib';
import { CollectionName } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { Areas } from '../collection-schema/Areas';
import { Actions } from '../collection-schema/Actions';
import { EventType, EventSchema } from '../collection-schema/Events';

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

export function getOpenStateForEvent(eventTypeId: string): Promise<string> {
    const eventTypesCollection = CbCollectionLib(CollectionName.EVENT_TYPES);
    const eventTypesCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.EVENT_TYPES }).equalTo('id', eventTypeId);

    const promise = eventTypesCollection.cbFetchPromise({ query: eventTypesCollectionQuery }).then((data: CbServer.CollectionFetchData<EventType>) => {
        const typeData = Array.isArray(data.DATA) && data.DATA[0]
        return typeData && !!typeData.has_lifecycle && JSON.parse(typeData.open_states || '[]').length ? JSON.parse(typeData.open_states as string)[0] : '';
    });
    Promise.runQueue();
    return promise;
}

export function createEvent(item: Record<string, any>) {
    const eventsCollection = CbCollectionLib(CollectionName.EVENTS);
    return eventsCollection.cbCreatePromise({ item });
}
