import { Asset } from "../collection-schema/Assets";
import { Areas } from "../collection-schema/Areas";
export declare function getAllAssetsForType(assetType: string): Promise<Asset[]>;
export declare function getAllAreasForType(areaType: string): Promise<Areas[]>;
