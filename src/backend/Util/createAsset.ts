import { Asset } from '../collection-schema/Assets';
import { Logger } from '../Logger';
import { LogLevels, CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';

export default function createAsset(assetID: string, assetData: Asset, logger: Logger): Promise<unknown> {
    logger.publishLog(LogLevels.DEBUG, 'DEBUG: ', 'in Create Asset');

    const assetsCol = CbCollectionLib(CollectionName.ASSETS);
    const newAsset = assetData;

    //DEV_TODO: optional/debatable, setting the date
    const date = new Date().toISOString();
    newAsset['last_location_updated'] = newAsset['last_location_updated'] ? newAsset['last_location_updated'] : date;
    newAsset['last_updated'] = newAsset['last_updated'] ? newAsset['last_updated'] : date;
    newAsset['id'] = assetID;
    try {
        newAsset['custom_data'] = JSON.stringify(assetData['custom_data'] ? assetData['custom_data'] : {});
    } catch (e) {
        logger.publishLog(LogLevels.ERROR, 'ERROR Failed to stringify ', e.message);
        return Promise.reject(new Error('Failed to stringify ' + e.message));
    }

    return assetsCol.cbCreatePromise({ item: [newAsset] as Record<string, unknown>[] });
}
