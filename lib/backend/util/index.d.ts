import { Asset } from '../collection-schema/Assets';
import { NormalizerDeviceMap } from '../global-config';
export interface FlattenedObject {
    [key: string]: string | number | boolean | Array<unknown>;
}
export declare function cbifyData(input: FlattenedObject, normalizerConfig: NormalizerDeviceMap): Asset;
export declare function cbifyAll(input: Array<FlattenedObject>, normalizerConfig: NormalizerDeviceMap): Array<Asset>;
export declare function flattenJSON(data: Record<string, unknown>): FlattenedObject;
export declare function flattenObjects(objArr: Array<Record<string, unknown>>): Array<FlattenedObject>;
export declare function normalizeData(incomingData: Array<Record<string, unknown>> | Record<string, unknown>, normalizerConfig: NormalizerDeviceMap): Array<Asset>;
export declare function cbFormatMacAddress(macAddr: string): string;
export declare const Topics: {
    AssetLocation: (ASSETID: string) => string;
    RulesAssetLocation: (ASSETID: string) => string;
    DBUpdateAssetLocation: (ASSETID: string) => string;
    HistoryAssetLocation: (ASSETID: string) => string;
    AssetHistory: (ASSETID: string) => string;
    DBUpdateAssetStatus: (ASSETID: string) => string;
    AreaLocationEvent: (AREAID: string) => string;
    ListenAllAssetsLocation: () => string;
    ListenAllAssetsStatus: () => string;
};
export declare function getAssetIdFromTopic(topic: string): string;
export declare function isEmpty(str: string): boolean;
export declare function isNormalizedDataValid(normalizedData: Array<Asset>): boolean;
