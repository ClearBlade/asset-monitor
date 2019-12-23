import { Asset } from '../../collection-schema/assets';

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

export function getAllAssetsForType(): Promise<Array<CbServer.CollectionSchema<Asset>>> {
    return new Promise(resolve => {
        resolve(assets);
    });
}
