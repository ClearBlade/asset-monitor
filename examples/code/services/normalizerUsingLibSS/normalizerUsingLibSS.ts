import { normalizer, MessageParser, PublishConfig } from '@clearblade/asset-monitor/lib/backend/Normalizer';
import { isNormalizedDataValid } from '@clearblade/asset-monitor/lib/backend/Util';
import { LogLevels, NormalizerDeviceMap } from '@clearblade/asset-monitor/lib/backend/global-config';
import { Asset } from '@clearblade/asset-monitor/lib/backend/collection-schema/Assets';
import '@clearblade/asset-monitor/lib/static/promise-polyfill/index.js';
import { Logger } from '@clearblade/asset-monitor/lib/backend/Logger';
// @ts-ignore
let ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
let log: { (s: any): void } = global.log;
/**
 * The keys passed in this config is what one can see in the normalizedData
 * From the normalized data, the selected keys are passed on to be published on corresponding topics
 *
 * 'id' is requried, since id is supposed to exist in every payload getting published on everytopic
 * 'type' is required, since it is required in the status & rules topic, optional for history
 */
const cmx_config: NormalizerDeviceMap = {
    location_x: 'x',
    location_y: 'y',
    location_z: 'z',
    location_unit: 'unit',
    location_type: 'location_type',
    last_updated: 'lastSeen',
    last_location_updated: 'lastSeen',
    id: 'id',
    type: 'type',
    custom_data: 'custom_data',
};

// const exampleIncomingData = {
//   x: 1,
//   y: 2,
//   z: 3,
//   unit: "meters",
//   location_type: "Spatial",
//   lastSeen: "2020-01-20T12:58:46.910-0500",
//   id: "cmx-1",
//   type: "CMX-Type-1",
//   custom_data: {
//     hello: "world"
//   }
// };

function processCMXData(incomingData: any, cmx_config: NormalizerDeviceMap): Array<Asset> {
    let processedData: Array<Asset> = [];

    if (typeof incomingData === 'object') {
        let record: Asset = {};
        Object.keys(cmx_config).forEach(function(value) {
            let key = cmx_config[value];
            record[value] = incomingData[key as string];
        });
        processedData.push(record);
    }

    return processedData;
}

function normalizerUsingLibSS(req: CbServer.BasicReq, resp: CbServer.Resp) {
    const SERVICE_INSTANCE_ID = req.service_instance_id;
    log('SERVICE_INSTANCE_ID:: ' + SERVICE_INSTANCE_ID);
    let topics = ['$share/mygroup/cmx_device'];
    ClearBlade.init({ request: req });
    let logger = Logger({ name: 'normalizerUsingLibSS' });

    let messageParser: MessageParser = function(err, msg, topic) {
        let promise = new Promise<Array<Asset>>(function(resolve, reject) {
            if (err) {
                reject('Error with incoming data to the normalizer ' + err + ' ' + topic);
            }
            try {
                var incomingData = JSON.parse(msg);
                logger.publishLog(LogLevels.DEBUG, incomingData);
            } catch (e) {
                reject('Error while parsing');
            }

            let normalizedData: Array<Asset> = processCMXData(incomingData, cmx_config);

            logger.publishLog(LogLevels.DEBUG, 'Normalized Data: ', normalizedData);

            if (!isNormalizedDataValid(normalizedData)) {
                let errMsg = 'Normalized Data is invalid';
                reject(errMsg);
            }

            resolve(normalizedData);
        });
        return promise;
    };

    const customRulesConfig: PublishConfig = {
        topicFn: (ASSETID: string): string => `_rules/_monitor/_asset/${ASSETID}`,
        keysToPublish: ['id', 'location_x', 'custom_data'],
        shouldPublishAsset: function(asset) {
            if (typeof asset.custom_data === 'undefined' || !asset.custom_data || typeof asset.id === 'undefined') {
                return false;
            }
            return true;
        },
    };

    const customLocationConfig: PublishConfig = {
        topicFn: (ASSETID: string): string => `_dbupdate/_monitor/_asset/${ASSETID}/location`,
        keysToPublish: ['id', 'location_x', 'location_y', 'location_z'],
        shouldPublishAsset: function(asset) {
            if (
                typeof asset.id === 'undefined' ||
                typeof asset.location_x === 'undefined' ||
                typeof asset.location_y === 'undefined' ||
                typeof asset.location_z === 'undefined'
            ) {
                return false;
            }
            return true;
        },
    };

    const customStatusConfig: PublishConfig = {
        topicFn: (ASSETID: string): string => `_dbupdate/_monitor/_asset/${ASSETID}/status`,
        keysToPublish: ['id', 'custom_data', 'type'],
        shouldPublishAsset: function(asset) {
            if (typeof asset.id === 'undefined' || typeof asset.custom_data === 'undefined' || !asset.custom_data) {
                return false;
            }
            return true;
        },
    };

    const customHistoryConfig: PublishConfig = {
        topicFn: (ASSETID: string): string => `_history/_monitor/_asset/${ASSETID}/location`,
        keysToPublish: ['id', 'location_x', 'location_y', 'location_z', 'custom_data'],
        shouldPublishAsset: function(asset) {
            if (typeof asset.id === 'undefined') {
                return false;
            }

            if (
                typeof asset.location_x !== 'undefined' ||
                typeof asset.location_y !== 'undefined' ||
                typeof asset.location_z !== 'undefined' ||
                (typeof asset.custom_data !== 'undefined' && !asset.custom_data)
            ) {
                return true;
            }

            return false;
        },
    };

    // Add default publish config, you can add any config and the normalizer will be publishing to that config
    let publishConfig = {
        locationConfig: customLocationConfig,
        statusConfig: customStatusConfig,
        historyConfig: customHistoryConfig,
        rulesConfig: customRulesConfig,
    };
    //resp.success("Something...");

    normalizer({
        req,
        resp,
        messageParser,
        topics,
        normalizerPubConfig: publishConfig,
    });
    //@ts-ignore
    Promise.runQueue();
}

//@ts-ignore
global.normalizerUsingLibSS = normalizerUsingLibSS;
