import { NormalizerPublishConfig } from '../Normalizer';
export interface LogLevel {
    [key: string]: LogLevels;
}
export interface NormalizerDeviceMap {
    [index: string]: string;
}
export declare enum LogLevels {
    INFO = "info",
    DEBUG = "debug",
    ERROR = "error",
    SUCCESS = "success"
}
export declare enum CollectionName {
    ASSETS = "assets",
    ASSET_HISTORY = "asset_history",
    ASSET_TYPES = "asset_types",
    AREAS = "areas",
    ACTIONS = "actions"
}
export declare enum AssetStatusUpdateMethod {
    OVERWRITE = "overwrite",
    MERGE = "merge"
}
export declare type IKeyForLocationUpdate = Array<string>;
export declare type IKeyForStatusUpdate = Array<string>;
export declare type AssetHistoryConfig = Array<string>;
export interface UpdateAssetLocationConfig {
    keysToUpdate: IKeyForLocationUpdate;
    createNewAssetifMissing: boolean;
}
export interface UpdateAssetStatusConfig {
    keysToUpdate: IKeyForStatusUpdate;
    updateMethod: AssetStatusUpdateMethod;
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
    UPDATE_ASSET_STATUS_CONFIG: UpdateAssetStatusConfig;
}
export declare function CreateConfig(config: GlobalConfig['CUSTOM_CONFIGS']): GlobalConfig;
export declare const GC: GlobalConfig;
