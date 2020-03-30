import { GC, CollectionName, UpdateAssetLocationOptions, LogLevels } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { CbCollectionLib } from '../collection-lib';
import { Logger } from '../Logger';
import { Topics, getErrorMessage } from '../Util';
import { bulkSubscriber } from '../Normalizer';
import '../../static/promise-polyfill';

interface UpdateAssetLocationDataOptions {
    fetchedData: CbServer.CollectionSchema;
    incomingMsg: Asset;
}

interface UpdateAssetLocationConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options?: UpdateAssetLocationOptions;
}

const defaultOptions = {
    KEYS_TO_UPDATE: GC.UPDATE_ASSET_LOCATION_OPTIONS.KEYS_TO_UPDATE,
    LOG_SETTING: GC.UPDATE_ASSET_LOCATION_OPTIONS.LOG_SETTING,
    CREATE_NEW_ASSET_IF_MISSING: GC.UPDATE_ASSET_LOCATION_OPTIONS.CREATE_NEW_ASSET_IF_MISSING,
    LOG_SERVICE_NAME: GC.UPDATE_ASSET_LOCATION_OPTIONS.LOG_SERVICE_NAME,
};

export function updateAssetLocationSS({
    req,
    resp,
    options: {
        KEYS_TO_UPDATE = defaultOptions.KEYS_TO_UPDATE,
        LOG_SETTING = defaultOptions.LOG_SETTING,
        LOG_SERVICE_NAME = defaultOptions.LOG_SERVICE_NAME,
        CREATE_NEW_ASSET_IF_MISSING = defaultOptions.CREATE_NEW_ASSET_IF_MISSING,
    } = defaultOptions,
}: UpdateAssetLocationConfig): void {
    const TOPIC = '$share/UpdateLocationGroup/' + Topics.DBUpdateAssetLocation('+');
    const TOPICS = [TOPIC, ...(!ClearBlade.isEdge() ? [TOPIC + '/_platform'] : [])];

    ClearBlade.init({ request: req });
    const messaging = ClearBlade.Messaging();

    const logger = new Logger({ name: LOG_SERVICE_NAME, logSetting: LOG_SETTING });

    //TODO default params in function
    //settings = settings || GC.UPDATE_ASSET_LOCATION_SETTINGS;

    function successCb(value: unknown): void {
        logger.publishLog(LogLevels.INFO, 'Succeeded ', value);
    }

    function failureCb(error: Error): void {
        logger.publishLog(LogLevels.ERROR, 'Failed ', getErrorMessage(error.message));
    }

    function updateAssetLocation(assetsOpts: UpdateAssetLocationDataOptions): Promise<unknown> {
        const currentState = assetsOpts.fetchedData;
        const incomingMsg = assetsOpts.incomingMsg;
        const assetsCol = CbCollectionLib(CollectionName.ASSETS);

        logger.publishLog(LogLevels.DEBUG, 'DEBUG: ', 'In Update Asset Location');
        if (!currentState.item_id) {
            return Promise.reject(new Error('Item Id is missing'));
        }
        const query = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo(
            'item_id',
            currentState.item_id,
        );

        const changes: Record<string, unknown> = {};

        for (let i = 0; KEYS_TO_UPDATE && i < KEYS_TO_UPDATE.length; i++) {
            const curKey = KEYS_TO_UPDATE[i];

            changes[curKey] = incomingMsg[curKey as keyof typeof incomingMsg];
        }

        //DEV_TODO: optional/debatable, setting the date
        const date = new Date().toISOString();
        changes['last_location_updated'] = changes['last_location_updated'] ? changes['last_location_updated'] : date;
        changes['last_updated'] = changes['last_updated'] ? changes['last_updated'] : date;

        //DEV_TODO comment the logs once the entire flow works or
        // just change the LOG_LEVEL to info in the custom_config
        logger.publishLog(LogLevels.DEBUG, 'DEBUG: logging changes: ', changes);

        return assetsCol.cbUpdatePromise({ query, changes });
    }

    function createAsset(assetID: string, assetData: Asset): Promise<unknown> {
        logger.publishLog(LogLevels.DEBUG, 'DEBUG: ', 'in Create Asset');

        const assetsCol = CbCollectionLib(CollectionName.ASSETS);
        const newAsset = assetData;

        //DEV_TODO: optional/debatable, setting the date
        const date = new Date().toISOString();
        newAsset['last_location_updated'] = newAsset['last_location_updated']
            ? newAsset['last_location_updated']
            : date;
        newAsset['last_updated'] = newAsset['last_updated'] ? newAsset['last_updated'] : date;
        newAsset['id'] = assetID;
        try {
            newAsset['custom_data'] = JSON.stringify(!!assetData['custom_data'] ? assetData['custom_data'] : {});
        } catch (e) {
            logger.publishLog(LogLevels.ERROR, 'ERROR Failed to stringify ', e.message);
            return Promise.reject(new Error('Failed to stringify ' + e.message));
        }

        return assetsCol.cbCreatePromise({ item: [newAsset] as Record<string, unknown>[] });
    }

    function HandleMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            logger.publishLog(LogLevels.ERROR, ' Failed to wait for message: ', err, ' ', msg, '  ', topic);
            resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }

        let incomingMsg: Asset;
        try {
            incomingMsg = JSON.parse(msg);
        } catch (e) {
            logger.publishLog(LogLevels.ERROR, 'Failed parse the message: ', e.message);
            return;
        }

        // Update for Jim/Ryan; Might fail for AD if used directly..
        //const assetID = getAssetIdFromTopic(topic);
        if (typeof incomingMsg['id'] === 'undefined') {
            logger.publishLog(
                LogLevels.ERROR,
                'Invalid message received, key: id missing in the payload ',
                topic,
                incomingMsg,
            );
            return;
        }

        const assetID = incomingMsg['id'];

        const fetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo('id', assetID);
        const assetsCol = CbCollectionLib(CollectionName.ASSETS);

        assetsCol
            .cbFetchPromise({ query: fetchQuery })
            .then(function(data) {
                if (data.DATA.length === 1) {
                    const fetchedData = data.DATA[0];
                    updateAssetLocation({ fetchedData, incomingMsg }).then(successCb, failureCb);
                } else if (data.DATA.length === 0) {
                    if (CREATE_NEW_ASSET_IF_MISSING) {
                        createAsset(assetID, incomingMsg).then(successCb, failureCb);
                        logger.publishLog(LogLevels.DEBUG, "Creating Asset since it doesn't exist");
                    } else {
                        logger.publishLog(LogLevels.DEBUG, 'DEBUG: ', " Asset doesn't exist so, ignoring: ", data);
                    }
                } else {
                    logger.publishLog(LogLevels.ERROR, 'ERROR: Multiple Assets with same assetId exists: ', data);
                }
            })
            .catch(function(error) {
                logger.publishLog(LogLevels.ERROR, 'Failed to fetch: ', error.message);
            });

        Promise.runQueue();
    }

    function WaitLoop(): void {
        logger.publishLog(LogLevels.INFO, 'Subscribed to Shared Topic. Starting Loop.');

        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage(TOPICS, HandleMessage);
        }
    }

    bulkSubscriber(TOPICS)
        .then(() => {
            WaitLoop();
        })
        .catch(e => {
            log(`Subscription error: ${e.message}`);
            resp.error(`Subscription error: ${e.message}`);
        });
    Promise.runQueue();
}
