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
    treeID: string;
    resp: CbServer.Resp;
    nodes: AssetTypeNodeDict;
    constructor(treeID: string, resp: CbServer.Resp, assetTypeNodeDict?: AssetTypeNodeDict);
    private createAssetTypeNode;
    updateCreatesCycle(parents: Set<AssetTypeID>, children: Set<AssetTypeID>): Boolean;
    createAssetType(newAssetTypeID: AssetTypeID, parents?: Set<AssetTypeID>, children?: Set<AssetTypeID>): void;
    deleteAssetType(assetTypeID: AssetTypeID): void;
    addRelationship(childID: AssetTypeID, parentID: AssetTypeID): void;
    removeRelationship(childID: AssetTypeID, parentID: AssetTypeID): void;
    updateCollection(): void;
    static treeToString(assetTypeTree: AssetTypeNodeDict): string;
    static treeFromString(assetTypeTreeStr: string): AssetTypeNodeDict;
}
export declare enum AssetTypeTreeMethod {
    CREATE_ASSET_TYPE = "createAssetType",
    DELETE_ASSET_TYPE = "deleteAssetType",
    REMOVE_RELATIONSHIP = "removeRelationship",
    ADD_RELATIONSHIP = "addRelationship"
}
export interface AssetTypeTreeOptions {
    METHOD_NAME: AssetTypeTreeMethod;
    ASSET_TYPE_ID?: AssetTypeID;
    PARENTS?: Array<AssetTypeID>;
    CHILDREN?: Array<AssetTypeID>;
    CHILD_ID?: AssetTypeID;
    PARENT_ID?: AssetTypeID;
}
export declare function assetTypeTreeHandler(req: CbServer.BasicReq, resp: CbServer.Resp, options: AssetTypeTreeOptions): void;
