import { Assets } from "../collection-schema/assets";
import { Areas } from "../collection-schema/Areas";
export declare function getAllAssetsForType(assetType: string): Promise<Assets[]>;
export declare function getAllAreasForType(areaType: string): Promise<Areas[]>;
