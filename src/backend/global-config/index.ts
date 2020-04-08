import { NormalizerPublishConfig } from '../Normalizer';
import { Topics } from '../Util';

export interface LogLevel {
    [key: string]: LogLevels;
}

export interface NormalizerDeviceMap {
    [index: string]: string | object;
}

export enum LogLevels {
    FATAL = 'fatal',
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    TRACE = 'trace',
}

export enum CollectionName {
    ASSETS = 'assets',
    ASSET_HISTORY = 'asset_history',
    ASSET_TYPES = 'asset_types',
    AREAS = 'areas',
    ACTIONS = 'actions',
    EVENT_TYPES = 'event_types',
    EVENTS = 'events',
    EVENT_HISTORY = 'event_history',
    RULES = 'rules',
}

export enum AssetStatusUpdateMethod {
    OVERWRITE = 'overwrite',
    MERGE = 'merge',
}

export type IKeyForLocationUpdate = Array<string>;

export type IKeyForStatusUpdate = Array<string>;

export type AssetHistoryConfig = Array<string>;

export interface UpdateAssetLocationOptions {
    KEYS_TO_UPDATE?: IKeyForLocationUpdate;
    LOG_SETTING: LogLevels;
    CREATE_NEW_ASSET_IF_MISSING?: boolean;
    LOG_SERVICE_NAME: string;
}

export interface UpdateAssetStatusOptions {
    LOG_SETTING: LogLevels;
    UPDATE_METHOD: AssetStatusUpdateMethod;
    LOG_SERVICE_NAME: string;
}

export enum KeyStorageSettings {
    NO = 'no',
    ALL = 'all',
    CUSTOM = 'custom',
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

const globalConfig: GlobalConfig = {
    LOG_SETTING: LogLevels.DEBUG,
    CUSTOM_CONFIGS: {},
    ASSET_HISTORY_CONFIG: {
        STANDARD_KEYS_TO_STORE: ['location_x', 'location_y', 'location_z'],
        CUSTOM_DATA_KEYS_TO_STORE: [],
        LOG_SETTING: LogLevels.DEBUG,
        STANDARD_KEY_STORAGE_SETTING: KeyStorageSettings.CUSTOM,
        CUSTOM_DATA_KEY_STORAGE_SETTING: KeyStorageSettings.ALL,
        LOG_SERVICE_NAME: 'AssetHistoryServiceNameUnset',
    },
    NORMALIZER_PUB_CONFIG: {
        locationConfig: {
            topicFn: Topics.DBUpdateAssetLocation,
            keysToPublish: [
                'id',
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
            keysToPublish: ['custom_data', 'id', 'type'],
        },
        historyConfig: {
            topicFn: Topics.AssetHistory,
            keysToPublish: [
                'id',
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
        rulesConfig: {
            topicFn: Topics.RulesAssetLocation,
            keysToPublish: [
                'id',
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
    UPDATE_ASSET_LOCATION_OPTIONS: {
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
            'group_id',
        ],
        CREATE_NEW_ASSET_IF_MISSING: false,
        LOG_SETTING: LogLevels.DEBUG,
        LOG_SERVICE_NAME: 'AssetLocationServiceNameUnset',
    },
    UPDATE_ASSET_STATUS_OPTIONS: {
        UPDATE_METHOD: AssetStatusUpdateMethod.MERGE,
        LOG_SETTING: LogLevels.DEBUG,
        LOG_SERVICE_NAME: 'AssetStatusServiceNameUnset',
    },
};

export function CreateConfig(config: GlobalConfig['CUSTOM_CONFIGS']): GlobalConfig {
    globalConfig.CUSTOM_CONFIGS = config;
    return globalConfig;
}

//globalConfig = CreateConfig(customConfig);

export const GC = globalConfig;
