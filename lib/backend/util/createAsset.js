"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
var collection_lib_1 = require("../collection-lib");
function createAsset(assetID, assetData, logger) {
    logger.publishLog(global_config_1.LogLevels.DEBUG, 'DEBUG: ', 'in Create Asset');
    var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
    var newAsset = assetData;
    //DEV_TODO: optional/debatable, setting the date
    var date = new Date().toISOString();
    newAsset['last_location_updated'] = newAsset['last_location_updated'] ? newAsset['last_location_updated'] : date;
    newAsset['last_updated'] = newAsset['last_updated'] ? newAsset['last_updated'] : date;
    newAsset['id'] = assetID;
    try {
        newAsset['custom_data'] = JSON.stringify(assetData['custom_data'] ? assetData['custom_data'] : {});
    }
    catch (e) {
        logger.publishLog(global_config_1.LogLevels.ERROR, 'ERROR Failed to stringify ', e.message);
        return Promise.reject(new Error('Failed to stringify ' + e.message));
    }
    return assetsCol.cbCreatePromise({ item: [newAsset] });
}
exports.default = createAsset;
