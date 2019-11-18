import { Assets } from "../collection-schema/assets";
import { CustomConfig } from "../global-config";
export interface FlattenedObject {
    [key: string]: string | number | boolean | Array<any>;
}
export declare function normalizeData(incomingData: any, normalizerConfig: Assets): Array<Assets>;
export declare function cbifyData(input: Assets, normalizerConfig: CustomConfig): Assets;
export declare function cbifyAll(input: Array<FlattenedObject>, normalizerConfig: Assets): Array<Assets>;
export declare function flattenObjects(objArr: Array<Object>): Array<FlattenedObject>;
export declare function flattenJSON(data: Object): FlattenedObject;
export declare function cbFormatMacAddress(macAddr: string): string;
export declare let Topics: {
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
export declare function isNormalizedDataValid(normalizedData: Array<Assets>): boolean;
export declare function isEmpty(str: any): boolean;
