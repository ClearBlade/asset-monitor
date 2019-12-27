import { NormalizerPublishConfig } from '../Normalizer';
import { Topics } from '../Util';

export interface LogLevel {
    [key: string]: LogLevels;
}

export interface NormalizerDeviceMap {
    [index: string]: string;
}

export enum LogLevels {
    INFO = 'info',
    DEBUG = 'debug',
    ERROR = 'error',
    SUCCESS = 'success',
}

export enum CollectionName {
    ASSETS = 'assets',
    ASSET_HISTORY = 'asset_history',
    ASSET_TYPES = 'asset_types',
    AREAS = 'areas',
    ACTIONS = 'actions',
}

export enum AssetStatusUpdateMethod {
    OVERWRITE = 'overwrite',
    MERGE = 'merge',
}

export type IKeyForLocationUpdate = Array<string>;

export type IKeyForStatusUpdate = Array<string>;

export type AssetHistoryConfig = Array<string>;

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

const globalConfig: GlobalConfig = {
    LOG_LEVEL: {
        INFO: LogLevels.INFO,
        DEBUG: LogLevels.DEBUG,
        ERROR: LogLevels.ERROR,
        SUCCESS: LogLevels.SUCCESS,
    },
    LOG_SETTING: LogLevels.DEBUG,
    CUSTOM_CONFIGS: {},
    ASSET_HISTORY_CONFIG: ['location_x', 'location_y', 'location_z'],
    NORMALIZER_PUB_CONFIG: {
        locationConfig: {
            topicFn: Topics.DBUpdateAssetLocation,
            keysToPublish: [
                'location_x',
                'location_y',
                'location_z',
                'location_unit',
                'location_type',
                'latitude',
                'longitude',
                'last_updated',
                'last_location_updated',
            ],
        },
        statusConfig: {
            topicFn: Topics.DBUpdateAssetStatus,
            keysToPublish: ['custom_data', 'type'],
        },
        historyConfig: {
            topicFn: Topics.AssetHistory,
            keysToPublish: [
                'location_x',
                'location_y',
                'location_z',
                'location_unit',
                'location_type',
                'latitude',
                'longitude',
                'last_updated',
                'last_location_updated',
                'custom_data',
                'type',
            ],
        },
    },
    UPDATE_ASSET_LOCATION_SETTINGS: {
        KEYS_TO_UPDATE: [
            'location_x',
            'location_y',
            'location_z',
            'location_unit',
            'location_type',
            'latitude',
            'longitude',
            'last_updated',
            'last_location_updated',
        ],
        LOG_SETTING: LogLevels.DEBUG,
        CREATE_NEW_ASSET_IF_MISSING: false,
    },
    UPDATE_ASSET_STATUS_SETTINGS: {
        UPDATE_METHOD: AssetStatusUpdateMethod.MERGE,
        LOG_SETTING: LogLevels.DEBUG,
    },
};

export function CreateConfig(config: GlobalConfig['CUSTOM_CONFIGS']): GlobalConfig {
    globalConfig.CUSTOM_CONFIGS = config;
    return globalConfig;
}

//globalConfig = CreateConfig(customConfig);

export const GC = globalConfig;
