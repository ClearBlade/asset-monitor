import { GC, CollectionName, UpdateAssetStatusOptions, LogLevels, AssetStatusUpdateMethod } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { Logger } from '../Logger';
import { Topics, getErrorMessage } from '../Util';
import { Asset } from '../collection-schema/Assets';
import { bulkSubscriber } from '../Normalizer';
import '../../static/promise-polyfill';

interface UpdateAssetStatusConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options: UpdateAssetStatusOptions;
}

const defaultOptions = {
    LOG_SETTING: GC.UPDATE_ASSET_STATUS_OPTIONS.LOG_SETTING,
    UPDATE_METHOD: GC.UPDATE_ASSET_STATUS_OPTIONS.UPDATE_METHOD,
    LOG_SERVICE_NAME: GC.UPDATE_ASSET_STATUS_OPTIONS.LOG_SERVICE_NAME,
};
export function updateAssetStatusSS({
    req,
    resp,
    options: {
        LOG_SETTING = defaultOptions.LOG_SETTING,
        UPDATE_METHOD = defaultOptions.UPDATE_METHOD,
        LOG_SERVICE_NAME = defaultOptions.LOG_SERVICE_NAME,
    } = defaultOptions,
}: UpdateAssetStatusConfig): void {
    ClearBlade.init({ request: req });

    const TOPIC = '$share/AssetStatusGroup/' + Topics.DBUpdateAssetStatus('+');
    const TOPICS = [TOPIC, ...(!ClearBlade.isEdge() ? [TOPIC + '/_platform'] : [])];

    const logger = new Logger({ name: LOG_SERVICE_NAME, logSetting: LOG_SETTING });
    const messaging = ClearBlade.Messaging();

    function failureCb(error: Error): void {
        logger.publishLog(LogLevels.ERROR, 'Failed ', getErrorMessage(error.message));
    }

    function MergeAsset(assetID: string, msg: Asset): Promise<unknown> {
        const assetsCol = CbCollectionLib(CollectionName.ASSETS);
        const assetFetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo('id', assetID);
        const promise = assetsCol.cbFetchPromise({ query: assetFetchQuery }).then(function(data) {
            if (data.DATA.length <= 0) {
                //TODO think of a better way to handle this
                logger.publishLog(LogLevels.ERROR, 'No asset found for id ', assetID);
                return Promise.reject(new Error('No asset found for id ' + assetID));
            }
            if (data.DATA.length > 1) {
                logger.publishLog(LogLevels.ERROR, 'Multiple Assets found for id ', assetID);
                return Promise.reject(new Error('Multiple Assets found for id ' + assetID));
            }

            const dataStr = (data.DATA[0] as Asset)['custom_data'] as string;
            let customData;
            try {
                customData = JSON.parse(dataStr);
            } catch (e) {
                logger.publishLog(LogLevels.ERROR, 'Failed while parsing: ', e.message);
                return Promise.reject(new Error('Failed while parsing: ' + e.message));
            }
            const incomingCustomData = msg['custom_data'];
            for (const key of Object.keys(incomingCustomData as object)) {
                customData[key] = (incomingCustomData as Record<string, unknown>)[key];
            }

            const currDate = new Date().toISOString();
            const assetsQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo('id', assetID);
            const statusChanges: Asset = { custom_data: JSON.stringify(customData), last_updated: currDate };
            logger.publishLog(LogLevels.DEBUG, 'Status Changes: ', statusChanges);
            return assetsCol.cbUpdatePromise({
                query: assetsQuery,
                changes: statusChanges as Record<string, unknown>,
            });
        });

        return promise;
    }

    function handleMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            logger.publishLog(LogLevels.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
            resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }

        let jsonMessage;
        try {
            jsonMessage = JSON.parse(msg);
        } catch (e) {
            logger.publishLog(LogLevels.ERROR, 'Failed while parsing: ', e.message);
            return;
        }
        // Update for Jim/Ryan; Might fail for AD if used directly..
        //const assetID = getAssetIdFromTopic(topic);
        let assetID = '';
        if (jsonMessage['id']) {
            assetID = jsonMessage['id'];
        }

        if (!assetID) {
            logger.publishLog(
                LogLevels.ERROR,
                'Invalid message received, key: id missing in the payload ',
                topic,
                jsonMessage,
            );
            resp.error('Invalid message received, key: id missing in the payload ' + topic);
        }
        if (UPDATE_METHOD === AssetStatusUpdateMethod.MERGE) {
            MergeAsset(assetID, jsonMessage).catch(failureCb);
        } else {
            logger.publishLog(
                LogLevels.ERROR,
                'AssetStatus update method ',
                UPDATE_METHOD,
                'Not supported. Hence, no updates performed',
            );
        }

        Promise.runQueue();
    }

    function WaitLoop(): void {
        logger.publishLog(LogLevels.INFO, 'Subscribed to Shared Topic. Starting Loop.');

        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage(TOPICS, handleMessage);
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
