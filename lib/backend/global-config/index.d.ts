import { NormalizerPublishConfig } from '../Normalizer';
export interface LogLevel {
    [key: string]: LogLevels;
}
export interface NormalizerDeviceMap {
    [index: string]: string | object;
}
export declare enum LogLevels {
    FATAL = "fatal",
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    TRACE = "trace"
}
export declare enum CollectionName {
    ASSETS = "assets",
    ASSET_HISTORY = "asset_history",
    ASSET_TYPES = "asset_types",
    ASSET_TYPE_TREE = "asset_type_tree",
    AREAS = "areas",
    ACTIONS = "actions",
    EVENT_TYPES = "event_types",
    EVENTS = "events",
    EVENT_HISTORY = "event_history",
    RULES = "rules"
}
export declare enum AssetStatusUpdateMethod {
    OVERWRITE = "overwrite",
    MERGE = "merge"
}
export declare type IKeyForLocationUpdate = Array<string>;
export declare type IKeyForStatusUpdate = Array<string>;
export declare type AssetHistoryConfig = Array<string>;
export interface UpdateAssetLocationOptions {
    KEYS_TO_UPDATE?: IKeyForLocationUpdate;
    LOG_SETTING: LogLevels;
    CREATE_NEW_ASSET_IF_MISSING?: boolean;
    LOG_SERVICE_NAME: string;
}
export interface UpdateAssetStatusOptions {
    CREATE_NEW_ASSET_IF_MISSING?: boolean;
    LOG_SETTING: LogLevels;
    UPDATE_METHOD: AssetStatusUpdateMethod;
    LOG_SERVICE_NAME: string;
}
export declare enum KeyStorageSettings {
    NO = "no",
    ALL = "all",
    CUSTOM = "custom"
}
export interface CreateAssetHistoryOptions {
    STANDARD_KEYS_TO_STORE: Array<string>;
    CUSTOM_DATA_KEYS_TO_STORE: Array<string>;
    LOG_SETTING: LogLevels;
    LOG_SERVICE_NAME: string;
    STANDARD_KEY_STORAGE_SETTING: KeyStorageSettings;
    CUSTOM_DATA_KEY_STORAGE_SETTING: KeyStorageSettings;
}
export interface GlobalConfig {
    LOG_SETTING: LogLevels;
    CUSTOM_CONFIGS: {
        [key: string]: NormalizerDeviceMap;
    };
    ASSET_HISTORY_CONFIG: CreateAssetHistoryOptions;
    NORMALIZER_PUB_CONFIG: NormalizerPublishConfig;
    UPDATE_ASSET_LOCATION_OPTIONS: UpdateAssetLocationOptions;
    UPDATE_ASSET_STATUS_OPTIONS: UpdateAssetStatusOptions;
}
export declare function CreateConfig(config: GlobalConfig['CUSTOM_CONFIGS']): GlobalConfig;
export declare const GC: GlobalConfig;
