import 'core-js/features/set';
import 'core-js/features/array';
export declare type AssetTypeID = string;
export interface AssetTypeNode {
    id: AssetTypeID;
    parents: Set<AssetTypeID>;
    children: Set<AssetTypeID>;
}
export interface AssetTypeNodeDict {
    [id: string]: AssetTypeNode;
}
export declare class AssetTypeTree {
    nodes: AssetTypeNodeDict;
    constructor(assetTypeNodeDict?: AssetTypeNodeDict);
    addChild(childID: AssetTypeID, parentID: AssetTypeID): void;
    removeChild(childID: AssetTypeID, parentID: AssetTypeID): void;
    getTopLevelAssetTypeIDs(): AssetTypeID[];
    private createAssetTypeNode;
    private updateCreatesCycle;
    addAssetTypeToTree(assetTypeID: AssetTypeID): void;
    deleteAssetTypeFromTree(assetTypeID: AssetTypeID): void;
    static treeToString(assetTypeTree: AssetTypeTree): string;
    static treeFromString(assetTypeTreeStr: string): AssetTypeTree;
}
