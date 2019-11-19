import { Topics } from "../util";
import { NormalizerPublishConfig } from "../normalizer";
import { Assets } from "../collection-schema/assets";

export interface LogLevel {
    [key: string]: LogLevels
}

export interface NormalizerDeviceMap{
  [index:string]:string;
};

export enum LogLevels {
    INFO = "info",
    DEBUG = "debug",
    ERROR = "error",
    SUCCESS = "success"
}

export enum CollectionName {
    ASSETS = "assets",
    ASSET_HISTORY = "asset_history",
    ASSET_TYPES = "asset_types"
}

export enum AssetStatusUpdateMethod{
  OVERWRITE = "overwrite",
  MERGE = "merge"
}

export interface IKeyForLocationUpdate extends Array<string> {} 

export interface IKeyForStatusUpdate extends Array<string> {} 



export interface AssetHistoryConfig extends Array<string> {}

export interface UpdateAssetLocationConfig {
  keysToUpdate: IKeyForLocationUpdate;
  createNewAssetifMissing:boolean;
}

export interface UpdateAssetStatusConfig {
  keysToUpdate:IKeyForStatusUpdate;
  updateMethod:AssetStatusUpdateMethod;
}


export interface GlobalConfig {
  LOG_LEVEL: LogLevel;
  LOG_SETTING: LogLevels;
  CUSTOM_CONFIGS: {
    [key: string]: NormalizerDeviceMap;
  };
  ASSET_HISTORY_CONFIG: AssetHistoryConfig;
  NORMALIZER_PUB_CONFIG: NormalizerPublishConfig;
  UPDATE_ASSET_LOCATION_CONFIG: UpdateAssetLocationConfig;
  UPDATE_ASSET_STATUS_CONFIG:UpdateAssetStatusConfig;
}



let globalConfig: GlobalConfig = {
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
      topicFn: Topics.DBUpdateAssetLocation,
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
      topicFn: Topics.DBUpdateAssetStatus,
      keysToPublish: ["custom_data", "type"]
    },
    historyConfig: {
      topicFn: Topics.AssetHistory,
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
  },

};

export function CreateConfig(config: GlobalConfig["CUSTOM_CONFIGS"]) {
         globalConfig.CUSTOM_CONFIGS = config;
         return globalConfig;
}

//globalConfig = CreateConfig(customConfig);

export const GC = globalConfig;