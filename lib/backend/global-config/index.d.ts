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
export interface UpdateAssetLocationSettings {
    KEYS_TO_UPDATE: IKeyForLocationUpdate;
    LOG_SETTING: LogLevels;
    CREATE_NEW_ASSET_IF_MISSING: boolean;
}
export interface UpdateAssetStatusSettings {
    LOG_SETTING: LogLevels;
    UPDATE_METHOD: AssetStatusUpdateMethod;
}
export interface GlobalConfig {
    LOG_LEVEL: LogLevel;
    LOG_SETTING: LogLevels;
    CUSTOM_CONFIGS: {
        [key: string]: NormalizerDeviceMap;
    };
    ASSET_HISTORY_CONFIG: AssetHistoryConfig;
    NORMALIZER_PUB_CONFIG: NormalizerPublishConfig;
    UPDATE_ASSET_LOCATION_SETTINGS: UpdateAssetLocationSettings;
    UPDATE_ASSET_STATUS_SETTINGS: UpdateAssetStatusSettings;
}
export declare function CreateConfig(config: GlobalConfig['CUSTOM_CONFIGS']): GlobalConfig;
export declare const GC: GlobalConfig;
