import { GC, CollectionName, UpdateAssetStatusSettings, LogLevels, AssetStatusUpdateMethod } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { Logger } from '../Logger';
import { getAssetIdFromTopic, Topics } from '../Util';
import { Asset } from '../collection-schema/Assets';

interface UpdateAssetStatusConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    settings: UpdateAssetStatusSettings;
}

export function updateAssetStatusSS(config: UpdateAssetStatusConfig): void {
    ClearBlade.init({ request: config.req });

    const TOPIC = '$share/AssetStatusGroup/' + Topics.DBUpdateAssetStatus('+');
    const logger = Logger({ name: 'updateAssetStatusSS' });
    const messaging = ClearBlade.Messaging();
    config.settings = config.settings || GC.UPDATE_ASSET_STATUS_SETTINGS;

    function failureCb(reason: unknown): void {
        logger.publishLog(LogLevels.ERROR, 'Failed ', reason);
    }

    function MergeAsset(assetID: string, msg: Record<string, any>): Promise<unknown> {
        const assetsCol = CbCollectionLib(CollectionName.ASSETS);
        const assetFetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo('id', assetID);
        const promise = assetsCol.cbFetchPromise({ query: assetFetchQuery }).then(function(data) {
            if (data.DATA.length <= 0) {
                logger.publishLog(LogLevels.ERROR, 'No asset found for id ', assetID);
                return Promise.reject(' No asset found for id ' + assetID);
            }
            if (data.DATA.length > 1) {
                logger.publishLog(LogLevels.ERROR, 'Multiple Assets found for id ', assetID);
                return Promise.reject(' Multiple Assets found for id ' + assetID);
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            const dataStr = data.DATA[0]['custom_data'];
            let customData;
            try {
                customData = JSON.parse(dataStr);
            } catch (e) {
                logger.publishLog(LogLevels.ERROR, 'Failed while parsing: ', e);
                return Promise.reject('Failed while parsing: ' + e);
            }
            const incomingCustomData = msg['custom_data'];
            for (const key of Object.keys(incomingCustomData)) {
                customData[key] = incomingCustomData[key];
            }

            const currDate = new Date().toISOString();
            const assetsQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo('id', assetID);
            const statusChanges: Asset = { custom_data: JSON.stringify(customData), last_updated: currDate };
            return assetsCol.cbUpdatePromise({
                query: assetsQuery,
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                changes: statusChanges,
            });
        });

        return promise;
    }

    function handleMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            logger.publishLog(LogLevels.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
            config.resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }

        let jsonMessage;
        try {
            jsonMessage = JSON.parse(msg);
        } catch (e) {
            logger.publishLog(LogLevels.ERROR, 'Failed while parsing: ', e);
            return;
        }

        const assetID = getAssetIdFromTopic(topic);
        if (!assetID) {
            logger.publishLog(LogLevels.ERROR, 'Invalid topic received: ', topic);
            config.resp.error('Invalid topic received: ' + topic);
        }
        if (config.settings.UPDATE_METHOD == AssetStatusUpdateMethod.MERGE) {
            MergeAsset(assetID, jsonMessage).catch(failureCb);
        } else {
            logger.publishLog(
                LogLevels.ERROR,
                'AssetStatus update method ',
                config.settings.UPDATE_METHOD,
                'Not supported. Hence, no updates performed',
            );
        }

        Promise.runQueue();
    }

    function WaitLoop(err: boolean, data: string | null): void {
        if (err) {
            logger.publishLog(LogLevels.ERROR, 'Subscribe failed ', data);
            config.resp.error(data);
        }
        logger.publishLog(LogLevels.SUCCESS, 'Subscribed to Shared Topic. Starting Loop.');

        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], handleMessage);
        }
    }

    messaging.subscribe(TOPIC, WaitLoop);
}

export const api = {
    default: updateAssetStatusSS,
};
