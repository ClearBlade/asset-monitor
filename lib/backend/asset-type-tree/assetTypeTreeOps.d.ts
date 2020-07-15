import 'core-js/features/set';
import 'core-js/features/array';
import { AssetType } from '../collection-schema/AssetType';
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
    getTree(): string;
    updateCreatesCycle(parents: Set<AssetTypeID>, children: Set<AssetTypeID>): boolean;
    createAssetType(newAssetTypeID: AssetTypeID, newAssetType: AssetType, parents?: Set<AssetTypeID>, children?: Set<AssetTypeID>): void;
    addAssetTypeToTree(newAssetTypeID: AssetTypeID, parents?: Set<AssetTypeID>, children?: Set<AssetTypeID>): void;
    deleteAssetType(assetTypeID: AssetTypeID): void;
    addRelationship(childID: AssetTypeID, parentID: AssetTypeID): void;
    removeRelationship(childID: AssetTypeID, parentID: AssetTypeID): void;
    updateAssetTypeTreeCollection(): void;
    addToAssetTypesCollection(newAssetType: AssetType): void;
    deleteFromAssetTypesCollection(assetTypeID: AssetTypeID): void;
    static treeToString(assetTypeTree: AssetTypeNodeDict): string;
    static treeFromString(assetTypeTreeStr: string): AssetTypeNodeDict;
    syncAssetTypeTreeWithAssetTypes(): void;
}
export declare enum AssetTypeTreeMethod {
    GET_TREE = "getTree",
    CREATE_ASSET_TYPE = "createAssetType",
    DELETE_ASSET_TYPE = "deleteAssetType",
    REMOVE_RELATIONSHIP = "removeRelationship",
    ADD_RELATIONSHIP = "addRelationship"
}
export interface AssetTypeTreeOptions {
    METHOD_NAME: AssetTypeTreeMethod;
    ASSET_TYPE_ID?: AssetTypeID;
    NEW_ASSET_TYPE?: AssetType;
    PARENTS?: Array<AssetTypeID>;
    CHILDREN?: Array<AssetTypeID>;
    CHILD_ID?: AssetTypeID;
    PARENT_ID?: AssetTypeID;
}
export declare function assetTypeTreeHandler(req: CbServer.BasicReq, resp: CbServer.Resp, options: AssetTypeTreeOptions): void;
