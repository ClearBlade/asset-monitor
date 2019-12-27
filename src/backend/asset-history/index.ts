import { GC, CollectionName } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { AssetHistory } from '../collection-schema/AssetHistory';
import { CbCollectionLib } from '../collection-lib';
import { Logger } from '../Logger';
import { Topics, getAssetIdFromTopic } from '../Util';

interface CreateAssetHistoryConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
}

export function createAssetHistorySS(config: CreateAssetHistoryConfig): void {
    const TOPIC = '$share/AssetHistoryGroup/' + Topics.HistoryAssetLocation('+');
    const SERVICE_INSTANCE_ID = config.req.service_instance_id;

    ClearBlade.init({ request: config.req });
    const messaging = ClearBlade.Messaging();
    const logger = Logger({ name: 'createAssetHistorySS' });

    function successCb(value: unknown): void {
        logger.publishLog(GC.LOG_LEVEL.SUCCESS, 'AssetHistory Creation Succeeded ', value);
    }

    function failureCb(reason: unknown): void {
        logger.publishLog(GC.LOG_LEVEL.ERROR, 'Failed ', reason);
    }

    function getEmptyAssetHistoryObject(): AssetHistory {
        return {
            change_date: '',
            asset_id: '',
            location_change: false,
            status_change: false,
            attribute_value: '',
            attribute_name: '',
        };
    }

    function createStandardHistoryData(assetID: string, parsedMsg: Asset): Array<AssetHistory> {
        const assetHistoryItems: Array<AssetHistory> = [];
        const currDate = new Date().toISOString();

        for (let i = 0; i < GC.ASSET_HISTORY_CONFIG.length; i++) {
            const currItem = getEmptyAssetHistoryObject();
            const attributeName = GC.ASSET_HISTORY_CONFIG[i];
            if (parsedMsg[attributeName as keyof Asset]) {
                currItem['asset_id'] = assetID;
                currItem['attribute_name'] = attributeName;
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                currItem['attribute_value'] = parsedMsg[attributeName as keyof Asset];
                currItem['change_date'] = parsedMsg.last_updated || currDate;
                currItem['location_change'] = true;
                currItem['status_change'] = false;

                assetHistoryItems.push(currItem);
            }
        }
        return assetHistoryItems;
    }

    function createCustomHistoryData(assetID: string, parsedMsg: Asset): Array<AssetHistory> {
        const customData = parsedMsg['custom_data'];

        if (!customData) {
            logger.publishLog(GC.LOG_LEVEL.DEBUG, 'Custom Data Missing: ', customData);
            return [];
        }

        const historyData: Array<AssetHistory> = [];
        const currDate = new Date().toISOString();

        for (const key of Object.keys(customData)) {
            historyData.push({
                ...getEmptyAssetHistoryObject(),
                change_date: currDate,
                attribute_name: key,
                asset_id: assetID,
                attribute_value: customData[key as keyof typeof customData],
                location_change: false,
                status_change: true,
            });
        }
        return historyData;
    }

    function HandleMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
            config.resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }

        let parsedMsg: Asset;
        try {
            parsedMsg = JSON.parse(msg);
        } catch (e) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, 'Failed parse the message: ', e);
            return;
        }
        let assetHistoryItems: Array<AssetHistory> = [];
        const assetID = getAssetIdFromTopic(topic);
        if (!assetID) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, 'Invalid topic received: ' + topic);
        }

        const standardHistoryData = createStandardHistoryData(assetID, parsedMsg);
        assetHistoryItems = assetHistoryItems.concat(standardHistoryData);
        assetHistoryItems = assetHistoryItems.concat(createCustomHistoryData(assetID, parsedMsg));

        logger.publishLog(GC.LOG_LEVEL.DEBUG, 'HistoryData ', assetHistoryItems);
        const assetHistoyCol = CbCollectionLib(CollectionName.ASSET_HISTORY);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        assetHistoyCol.cbCreatePromise({ item: assetHistoryItems }).then(successCb, failureCb);

        Promise.runQueue();
    }

    function WaitLoop(err: boolean, data: string | null): void {
        if (err) {
            logger.publishLog(GC.LOG_LEVEL.ERROR, 'Subscribe failed for: ', SERVICE_INSTANCE_ID, ': ', data);
            config.resp.error(data);
        }
        logger.publishLog(GC.LOG_LEVEL.SUCCESS, 'Subscribed to Shared Topic. Starting Loop.');

        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }

    messaging.subscribe(TOPIC, WaitLoop);
}

export const api = {
    default: createAssetHistorySS,
};
