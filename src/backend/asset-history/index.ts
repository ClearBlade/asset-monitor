import { GC, CollectionName, LogLevels } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { AssetHistory } from '../collection-schema/AssetHistory';
import { CbCollectionLib } from '../collection-lib';
import { Logger } from '../Logger';
import { Topics } from '../Util';
import { CreateAssetHistoryOptions } from '../global-config';

interface CreateAssetHistoryConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options?: CreateAssetHistoryOptions;
}

const defaultOptions = {
    standardKeysToStore: GC.ASSET_HISTORY_CONFIG.standardKeysToStore,
    customDataKeysToStore:GC.ASSET_HISTORY_CONFIG.customDataKeysToStore,
    LOG_SETTING : GC.ASSET_HISTORY_CONFIG.LOG_SETTING,
};
export function createAssetHistorySS({
    req,
    resp,
    options:{
        standardKeysToStore = defaultOptions.standardKeysToStore,
        customDataKeysToStore = defaultOptions.customDataKeysToStore,
        LOG_SETTING = defaultOptions.LOG_SETTING,
    } = defaultOptions,
}: CreateAssetHistoryConfig): void {
    const TOPIC = '$share/AssetHistoryGroup/' + Topics.HistoryAssetLocation('+');
    const SERVICE_INSTANCE_ID = req.service_instance_id;

    ClearBlade.init({ request: req });
    const messaging = ClearBlade.Messaging();
    const logger = Logger({ name: 'AssetHistorySSLib', logSetting: LOG_SETTING });

    function successCb(value: unknown): void {
        logger.publishLog(LogLevels.SUCCESS, 'AssetHistory Creation Succeeded ', value);
    }

    function failureCb(reason: unknown): void {
        logger.publishLog(LogLevels.ERROR, 'Failed ', reason);
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

        for (let i = 0; i < standardKeysToStore.length; i++) {
            const currItem = getEmptyAssetHistoryObject();
            const attributeName = standardKeysToStore[i];
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
            logger.publishLog(LogLevels.DEBUG, 'Custom Data Missing: ', customData);
            return [];
        }

        const historyData: Array<AssetHistory> = [];
        const currDate = new Date().toISOString();
        const keysToStore = (customDataKeysToStore.length > 0) ? customDataKeysToStore : Object.keys(customData);
        
        for (const key of keysToStore) {
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
            logger.publishLog(LogLevels.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
            resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
        }

        let parsedMsg: Asset;
        try {
            parsedMsg = JSON.parse(msg);
        } catch (e) {
            logger.publishLog(LogLevels.ERROR, 'Failed parse the message: ', e);
            return;
        }
        let assetHistoryItems: Array<AssetHistory> = [];
        // Update for Jim/Ryan; Might fail for AD if used directly..
        //const assetID = getAssetIdFromTopic(topic);
        
        let assetID = '';
        
        if(parsedMsg["id"]){
            assetID = parsedMsg["id"];
        }
        
        if (!assetID) {
            logger.publishLog(LogLevels.ERROR, 'Invalid message received, key: id missing in the payload ', topic, parsedMsg);
            resp.error('Invalid message received, key: id missing in the payload '+ topic);
        }

        const standardHistoryData = createStandardHistoryData(assetID, parsedMsg);
        assetHistoryItems = assetHistoryItems.concat(standardHistoryData);
        assetHistoryItems = assetHistoryItems.concat(createCustomHistoryData(assetID, parsedMsg));

        logger.publishLog(LogLevels.DEBUG, 'HistoryData ', assetHistoryItems);
        const assetHistoyCol = CbCollectionLib(CollectionName.ASSET_HISTORY);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        assetHistoyCol.cbCreatePromise({ item: assetHistoryItems }).then(successCb, failureCb);

        Promise.runQueue();
    }

    function WaitLoop(err: boolean, data: string | null): void {
        if (err) {
            logger.publishLog(LogLevels.ERROR, 'Subscribe failed for: ', SERVICE_INSTANCE_ID, ': ', data);
            resp.error(data);
        }
        logger.publishLog(LogLevels.SUCCESS, 'Subscribed to Shared Topic. Starting Loop.');

        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }

    messaging.subscribe(TOPIC, WaitLoop);
}
