import { Asset } from '../../collection-schema/assets';
import { Areas } from '../../collection-schema/Areas';

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
    // {
    //     custom_data: {},
    //     description: '',
    //     id: 'testAsset3',
    //     image: '',
    //     item_id: 'test3',
    //     label: 'Test Asset 3',
    //     last_updated: '',
    //     owners: '',
    //     parent: '',
    //     type: 'gondola',
    //     latitude: null,
    //     longitude: null,
    // },
    // {
    //     custom_data: {},
    //     description: '',
    //     id: 'testAsset4',
    //     image: '',
    //     item_id: 'test4',
    //     label: 'Test Asset 4',
    //     last_updated: '',
    //     owners: '',
    //     parent: '',
    //     type: 'flatcar',
    //     latitude: null,
    //     longitude: null,
    // },
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
    // {
    //     custom_data: {},
    //     description: '',
    //     id: 'testArea3',
    //     image: '',
    //     item_id: 'test3',
    //     label: 'Test Area 3',
    //     last_updated: '',
    //     owners: '',
    //     parent: '',
    //     type: 'warehouse',
    //     latitude: null,
    //     longitude: null,
    // },
    // {
    //     custom_data: {},
    //     description: '',
    //     id: 'testArea4',
    //     image: '',
    //     item_id: 'test4',
    //     label: 'Test Area 4',
    //     last_updated: '',
    //     owners: '',
    //     parent: '',
    //     type: 'factory',
    //     latitude: null,
    //     longitude: null,
    // },
];

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
