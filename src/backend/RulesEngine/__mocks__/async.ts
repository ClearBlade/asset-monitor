import { Asset } from '../../collection-schema/assets';
import { Areas } from '../../collection-schema/Areas';
import { EventState } from '../async';

export function getAllAssetsForType(): Promise<Array<CbServer.CollectionSchema<Asset>>> {
    return new Promise(resolve => {
        resolve(assets);
    });
}

export function getAllAreasForType(): Promise<Array<CbServer.CollectionSchema<Asset>>> {
    return new Promise(resolve => {
        resolve(areas);
    });
}

export function getStateForEvent(): Promise<EventState> {
    return new Promise(resolve => {
        resolve({ is_open: false, state: 'Closed' });
    });
}

export function createEvent(): Promise<undefined> {
    return new Promise(resolve => {
        resolve();
    });
}

export function createEventHistoryItem(): Promise<undefined> {
    return new Promise(resolve => {
        resolve();
    });
}

export function shouldCreateOrUpdateEvent(): Promise<boolean> {
    return new Promise(resolve => {
        resolve(true);
    });
}

export function closeRules(): Promise<boolean> {
    return new Promise(resolve => {
        resolve(true);
    });
}

const assets: Array<CbServer.CollectionSchema<Asset>> = [
    {
        custom_data: {},
        description: '',
        id: 'testAsset1',
        image: '',
        item_id: 'test1',
        label: 'Test Asset 1',
        last_updated: '',
        owners: '',
        parent: '',
        type: 'train',
        latitude: null,
        longitude: null,
    },
    {
        custom_data: {},
        description: '',
        id: 'testAsset2',
        image: '',
        item_id: 'test2',
        label: 'Test Asset 2',
        last_updated: '',
        owners: '',
        parent: '',
        type: 'train',
        latitude: null,
        longitude: null,
    },
];

const areas: Array<CbServer.CollectionSchema<Areas>> = [
    {
        custom_data: {},
        description: '',
        id: 'testArea1',
        image: '',
        item_id: 'test1',
        label: 'Test Area 1',
        last_updated: '',
        owners: '',
        parent: '',
        type: 'yard',
        latitude: null,
        longitude: null,
    },
    {
        custom_data: {},
        description: '',
        id: 'testArea2',
        image: '',
        item_id: 'test2',
        label: 'Test Area 2',
        last_updated: '',
        owners: '',
        parent: '',
        type: 'yard',
        latitude: null,
        longitude: null,
    },
];
