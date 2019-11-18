import { Assets } from "../CollectionSchemas/assets";
import { CustomConfig } from "../GlobalConfig";
export interface FlattenedObject {
    [key: string]: string | number | boolean | Array<any>;
}
export declare function Util(): {
    NormalizeData: (incomingData: any, normalizerConfig: Assets) => Assets[];
    CBifyData: (input: Assets, normalizerConfig: CustomConfig) => Assets;
    CBifyAll: (input: FlattenedObject[], normalizerConfig: Assets) => Assets[];
    flattenObjects: (objArr: Object[]) => FlattenedObject[];
    flattenJSON: (data: Object) => FlattenedObject;
    CBFormatMacAddress: (macAddr: string) => string;
    Topics: {
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
    GetAssetIdFromTopic: (topic: string) => string;
    IsNormalizedDataValid: (normalizedData: Assets[]) => boolean;
};
