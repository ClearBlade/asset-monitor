import { GC, CollectionName } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { CbCollectionLib } from '../collection-lib';
import { Logger } from '../Logger';
import { Topics, getAssetIdFromTopic } from '../Util';

interface UpdateAssetLocationOptions {
    fetchedData: CbServer.CollectionSchema;
    incomingMsg: Asset;
}

interface UpdateAssetLocationConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
}

export function updateAssetLocationSS(config: UpdateAssetLocationConfig): void {
    const TOPIC = '$share/UpdateLocationGroup/' + Topics.DBUpdateAssetLocation('+');
    const SERVICE_INSTANCE_ID = config.req.service_instance_id;

    ClearBlade.init({ request: config.req });
    const messaging = ClearBlade.Messaging();
    const logger = Logger();

    function successCb(value: unknown): void {
        logger.publishLog(GC.LOG_LEVEL.SUCCESS, 'updateAssetLocationSS - Succeeded ', value);
    }

    function failureCb(reason: unknown): void {
        logger.publishLog(GC.LOG_LEVEL.ERROR, 'updateAssetLocationSS - Failed ', reason);
    }

    function updateAssetLocation(assetsOpts: UpdateAssetLocationOptions): Promise<unknown> {
        const currentState = assetsOpts.fetchedData;
        const incomingMsg = assetsOpts.incomingMsg;
        const assetsCol = CbCollectionLib(CollectionName.ASSETS);

        logger.publishLog(GC.LOG_LEVEL.DEBUG, 'DEBUG: ', 'updateAssetLocationSS - In Update Asset Location');
        if (!currentState.item_id) {
            return Promise.reject('Item Id is missing');
        }
        const query = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo(
            'item_id',
            currentState.item_id,
        );
        const changes: Asset = {};

        for (let i = 0; i < GC.UPDATE_ASSET_LOCATION_CONFIG.keysToUpdate.length; i++) {
            const curKey = GC.UPDATE_ASSET_LOCATION_CONFIG.keysToUpdate[i];
            changes[curKey as keyof Asset] = incomingMsg[curKey as keyof typeof incomingMsg];
        }

        //DEV_TODO: optional/debatable, setting the date
        const date = new Date().toISOString();
        changes['last_location_updated'] = changes['last_location_updated'] ? changes['last_location_updated'] : date;
        changes['last_updated'] = changes['last_updated'] ? changes['last_updated'] : date;

        //DEV_TODO comment the logs once the entire flow works or
        // just change the LOG_LEVEL to info in the custom_config
        logger.publishLog(GC.LOG_LEVEL.DEBUG, 'DEBUG: logging changes: ', changes);
        return assetsCol.cbUpdatePromise({ query, changes });
    }

    function createAsset(assetID: string, assetData: Asset): Promise<unknown> {
        logger.publishLog(GC.LOG_LEVEL.DEBUG, 'DEBUG: ', 'updateAssetLocationSS - in Create Asset');

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
            newAsset['custom_data'] = JSON.stringify(assetData['custom_data']);
        } catch (e) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, 'ERROR: ', SERVICE_INSTANCE_ID, ': Failed to stringify ', e);
            return Promise.reject('Failed to stringify ' + e);
        }
        return assetsCol.cbCreatePromise({ item: [newAsset] });
    }

    function HandleMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            logger.publishLog(
                GC.LOG_LEVEL.ERROR,
                'updateAssetLocationSS -  Failed to wait for message: ',
                err,
                ' ',
                msg,
                '  ',
                topic,
            );
            config.resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }

        let incomingMsg: Asset;
        try {
            incomingMsg = JSON.parse(msg);
        } catch (e) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, 'updateAssetLocationSS - Failed parse the message: ', e);
            // service can exit here if we add resp.error(""), right now it fails silently by just publishing on error topic
            return;
        }

        const assetID = getAssetIdFromTopic(topic);

        if (!assetID) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, 'updateAssetLocationSS - Invalid topic received: ', topic);
            return;
        }

        const fetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo('id', assetID);
        const assetsCol = CbCollectionLib(CollectionName.ASSETS);

        assetsCol
            .cbFetchPromise({ query: fetchQuery })
            .then(function(data) {
                if (data.DATA.length === 1) {
                    const fetchedData = data.DATA[0];
                    updateAssetLocation({ fetchedData, incomingMsg }).then(successCb, failureCb);
                } else if (data.DATA.length === 0) {
                    createAsset(assetID, incomingMsg).then(successCb, failureCb);
                    logger.publishLog(
                        GC.LOG_LEVEL.ERROR,
                        'ERROR: ',
                        "updateAssetLocationSS -  Asset doesn't exist so, ignoring: ",
                        data,
                    );
                } else {
                    logger.publishLog(
                        GC.LOG_LEVEL.ERROR,
                        'ERROR: ',
                        'updateAssetLocationSS -  Multiple Assets with same assetId exists: ',
                        data,
                    );
                }
            })
            .catch(function(reason) {
                logger.publishLog(GC.LOG_LEVEL.ERROR, 'updateAssetLocationSS - Failed to fetch: ', reason);
                config.resp.error('Failed to fetch asset: ' + reason);
            });

        Promise.runQueue();
    }

    function WaitLoop(err: boolean, data: string | null): void {
        if (err) {
            logger.publishLog(
                GC.LOG_LEVEL.ERROR,
                'updateAssetLocationSS - Subscribe failed for: ',
                SERVICE_INSTANCE_ID,
                ': ',
                data,
            );
            config.resp.error(data);
        }
        logger.publishLog(GC.LOG_LEVEL.SUCCESS, 'updateAssetLocationSS - Subscribed to Shared Topic. Starting Loop.');

        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }

    messaging.subscribe(TOPIC, WaitLoop);
}
