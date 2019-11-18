"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../Util");
var util = Util_1.Util();
;
var LogLevels;
(function (LogLevels) {
    LogLevels["INFO"] = "info";
    LogLevels["DEBUG"] = "debug";
    LogLevels["ERROR"] = "error";
    LogLevels["SUCCESS"] = "success";
})(LogLevels = exports.LogLevels || (exports.LogLevels = {}));
var CollectionName;
(function (CollectionName) {
    CollectionName["ASSETS"] = "assets";
    CollectionName["ASSET_HISTORY"] = "asset_history";
    CollectionName["ASSET_TYPES"] = "asset_types";
})(CollectionName = exports.CollectionName || (exports.CollectionName = {}));
var AssetStatusUpdateMethod;
(function (AssetStatusUpdateMethod) {
    AssetStatusUpdateMethod["OVERWRITE"] = "overwrite";
    AssetStatusUpdateMethod["MERGE"] = "merge";
})(AssetStatusUpdateMethod = exports.AssetStatusUpdateMethod || (exports.AssetStatusUpdateMethod = {}));
var globalConfig = {
    LOG_LEVEL: {
        INFO: LogLevels.INFO,
        DEBUG: LogLevels.DEBUG,
        ERROR: LogLevels.ERROR,
        SUCCESS: LogLevels.SUCCESS
    },
    LOG_SETTING: LogLevels.DEBUG,
    CUSTOM_CONFIGS: {},
    ASSET_HISTORY_CONFIG: ["location_x", "location_y", "location_z"],
    NORMALIZER_PUB_CONFIG: {
        locationConfig: {
            topicFn: util.Topics.DBUpdateAssetLocation,
            keysToPublish: [
                "location_x",
                "location_y",
                "location_z",
                "location_unit",
                "location_type",
                "geo_latitude",
                "geo_longitude",
                "geo_altitude",
                "geo_unit",
                "last_updated",
                "last_location_updated"
            ]
        },
        statusConfig: {
            topicFn: util.Topics.DBUpdateAssetStatus,
            keysToPublish: ["custom_data", "type"]
        },
        historyConfig: {
            topicFn: util.Topics.AssetHistory,
            keysToPublish: [
                "location_x",
                "location_y",
                "location_z",
                "location_unit",
                "location_type",
                "geo_latitude",
                "geo_longitude",
                "geo_altitude",
                "geo_unit",
                "last_updated",
                "last_location_updated",
                "custom_data",
                "type"
            ]
        }
    },
    UPDATE_ASSET_LOCATION_CONFIG: {
        keysToUpdate: [
            "location_x",
            "location_y",
            "location_z",
            "location_unit",
            "location_type",
            "geo_latitude",
            "geo_longitude",
            "geo_altitude",
            "geo_unit",
            "last_updated",
            "last_location_updated"
        ],
        createNewAssetifMissing: false
    },
    UPDATE_ASSET_STATUS_CONFIG: {
        keysToUpdate: ["custom_data"],
        updateMethod: AssetStatusUpdateMethod.MERGE
    }
};
function CreateConfig(config) {
    globalConfig.CUSTOM_CONFIGS = config;
    return globalConfig;
}
exports.CreateConfig = CreateConfig;
//globalConfig = CreateConfig(customConfig);
exports.GC = globalConfig;
