import { GC, CollectionName, LogLevels, KeyStorageSettings, CreateAssetHistoryOptions } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { AssetHistory } from '../collection-schema/AssetHistory';
import { CbCollectionLib } from '../collection-lib';
import { Logger } from '../Logger';
import { Topics } from '../Util';
interface CreateAssetHistoryConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options?: CreateAssetHistoryOptions;
}

const defaultOptions = {
    STANDARD_KEYS_TO_STORE: GC.ASSET_HISTORY_CONFIG.STANDARD_KEYS_TO_STORE,
    CUSTOM_DATA_KEYS_TO_STORE: GC.ASSET_HISTORY_CONFIG.CUSTOM_DATA_KEYS_TO_STORE,
    STANDARD_KEY_STORAGE_SETTING: GC.ASSET_HISTORY_CONFIG.STANDARD_KEY_STORAGE_SETTING,
    CUSTOM_DATA_KEY_STORAGE_SETTING: GC.ASSET_HISTORY_CONFIG.CUSTOM_DATA_KEY_STORAGE_SETTING,
    LOG_SETTING: GC.ASSET_HISTORY_CONFIG.LOG_SETTING,
};
export function createAssetHistorySS({
    req,
    resp,
    options: {
        STANDARD_KEYS_TO_STORE = defaultOptions.STANDARD_KEYS_TO_STORE,
        CUSTOM_DATA_KEYS_TO_STORE = defaultOptions.CUSTOM_DATA_KEYS_TO_STORE,
        LOG_SETTING = defaultOptions.LOG_SETTING,
        CUSTOM_DATA_KEY_STORAGE_SETTING = defaultOptions.CUSTOM_DATA_KEY_STORAGE_SETTING,
        STANDARD_KEY_STORAGE_SETTING = defaultOptions.STANDARD_KEY_STORAGE_SETTING,
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
            asset_type: '',
        };
    }

    function createStandardHistoryData(assetID: string, parsedMsg: Asset): Array<AssetHistory> {
        const assetHistoryItems: Array<AssetHistory> = [];
        const currDate = new Date().toISOString();

        if (
            STANDARD_KEY_STORAGE_SETTING === KeyStorageSettings.NO ||
            STANDARD_KEY_STORAGE_SETTING === KeyStorageSettings.ALL
        ) {
            return [];
        }
        //Implied the setting is CUSTOM
        if (STANDARD_KEYS_TO_STORE && STANDARD_KEYS_TO_STORE.length <= 0) {
            return [];
        }
        logger.publishLog(LogLevels.DEBUG, 'STANDARD_KEYS_TO_STORE Data: ', STANDARD_KEYS_TO_STORE);

        for (let i = 0; i < STANDARD_KEYS_TO_STORE.length; i++) {
            const currItem = getEmptyAssetHistoryObject();
            const attributeName = STANDARD_KEYS_TO_STORE[i];
            const attributeValue = parsedMsg[attributeName as keyof Asset];
            if (typeof attributeValue !== 'undefined') {
                currItem['asset_id'] = assetID;
                currItem['attribute_name'] = attributeName;
                currItem['attribute_value'] = attributeValue;
                currItem['change_date'] = parsedMsg.last_updated || currDate;
                currItem['location_change'] = true;
                currItem['status_change'] = false;
                currItem['asset_type'] = parsedMsg.type;
                assetHistoryItems.push(currItem);
            }
        }

        logger.publishLog(LogLevels.DEBUG, 'StandardKeys Parsed Data: ', assetHistoryItems);

        return assetHistoryItems;
    }

    function createCustomHistoryData(assetID: string, parsedMsg: Asset): Array<AssetHistory> {
        const customData = parsedMsg['custom_data'];

        if (
            CUSTOM_DATA_KEY_STORAGE_SETTING === KeyStorageSettings.NO ||
            (CUSTOM_DATA_KEY_STORAGE_SETTING === KeyStorageSettings.CUSTOM &&
                CUSTOM_DATA_KEYS_TO_STORE &&
                CUSTOM_DATA_KEYS_TO_STORE.length <= 0)
        ) {
            return [];
        }

        if (!customData) {
            logger.publishLog(LogLevels.DEBUG, 'Custom Data Missing: ', customData);
            return [];
        }

        const historyData: Array<AssetHistory> = [];
        const currDate = new Date().toISOString();
        const keysToStore =
            CUSTOM_DATA_KEY_STORAGE_SETTING === KeyStorageSettings.ALL
                ? Object.keys(customData)
                : CUSTOM_DATA_KEYS_TO_STORE;

        for (const key of keysToStore) {
            if (key) {
                historyData.push({
                    ...getEmptyAssetHistoryObject(),
                    change_date: parsedMsg.last_updated || currDate,
                    attribute_name: key,
                    asset_id: assetID,
                    attribute_value: customData[key as keyof typeof customData],
                    location_change: false,
                    status_change: true,
                    asset_type: parsedMsg.type,
                });
            }
        }
        return historyData;
    }

    function HandleMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            logger.publishLog(LogLevels.ERROR, 'Failed to wait for message: ', err, ' ', msg, '  ', topic);
        }

        let parsedMsg: Asset;
        try {
            parsedMsg = JSON.parse(msg);
        } catch (e) {
            logger.publishLog(LogLevels.ERROR, 'Failed parse the message: ', e.message);
            return;
        }
        let assetHistoryItems: Array<AssetHistory> = [];
        // Update for Jim/Ryan; Might fail for AD if used directly..
        //const assetID = getAssetIdFromTopic(topic);

        let assetID = '';

        if (parsedMsg['id']) {
            assetID = parsedMsg['id'];
        }

        if (!assetID) {
            logger.publishLog(
                LogLevels.ERROR,
                'Invalid message received, key: id missing in the payload ',
                topic,
                parsedMsg,
            );
            resp.error('Invalid message received, key: id missing in the payload ' + topic);
        }

        const standardHistoryData = createStandardHistoryData(assetID, parsedMsg);
        assetHistoryItems = assetHistoryItems.concat(standardHistoryData);
        assetHistoryItems = assetHistoryItems.concat(createCustomHistoryData(assetID, parsedMsg));

        logger.publishLog(LogLevels.DEBUG, 'HistoryData ', assetHistoryItems);

        if (assetHistoryItems.length < 1) {
            logger.publishLog(LogLevels.DEBUG, 'No data to store for asset-history');
            return;
        }

        const assetHistoyCol = CbCollectionLib(CollectionName.ASSET_HISTORY);

        assetHistoyCol
            .cbCreatePromise({ item: assetHistoryItems as Record<string, unknown>[] })
            .then(successCb, failureCb);

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
