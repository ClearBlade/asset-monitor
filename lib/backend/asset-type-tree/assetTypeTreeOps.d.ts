import { AssetType } from '../collection-schema/AssetType';
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
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    nodes: AssetTypeNodeDict;
    constructor(treeID: string, req: CbServer.BasicReq, resp: CbServer.Resp, assetTypeNodeDict?: AssetTypeNodeDict);
    getTree(): string;
    getTopLevelAssetTypes(): AssetType[];
    createAssetType(createAssetTypeOptions: CreateAssetTypeOptions): void;
    deleteAssetType(deleteAssetTypeoptions: DeleteAssetTypeOptions): void;
    addChild(addOrRemoveChildOptions: AddOrRemoveChildOptions): void;
    removeChild(addOrRemoveChildOptions: AddOrRemoveChildOptions): void;
    getTopLevelNodeIDs(): AssetTypeID[];
    private createAssetTypeNode;
    private updateCreatesCycle;
    private addAssetTypeToTree;
    private addToAssetTypesCollection;
    private deleteAssetTypeFromTree;
    private deleteFromAssetTypesCollection;
    updateAssetTypeTreeCollection(): void;
    syncAssetTypeTreeWithAssetTypes(): void;
    static treeToString(assetTypeTree: AssetTypeNodeDict): string;
    static treeFromString(assetTypeTreeStr: string): AssetTypeNodeDict;
    private handleTrigger;
}
export declare enum AssetTypeTreeMethod {
    GET_TREE = "getTree",
    GET_TOP_LEVEL_ASSET_TYPES = "getTopLevelAssetTypes",
    CREATE_ASSET_TYPE = "createAssetType",
    DELETE_ASSET_TYPE = "deleteAssetType",
    ADD_CHILD = "addChild",
    REMOVE_CHILD = "removeChild"
}
export interface CreateAssetTypeOptions {
    ASSET_TYPE: AssetType;
    CHILDREN?: Array<AssetTypeID>;
}
export interface DeleteAssetTypeOptions {
    ASSET_TYPE_ID: AssetTypeID;
}
export interface AddOrRemoveChildOptions {
    CHILD_ID: AssetTypeID;
    PARENT_ID: AssetTypeID;
}
export declare type MethodOptions = CreateAssetTypeOptions | DeleteAssetTypeOptions | AddOrRemoveChildOptions;
export interface AssetTypeTreeOptions {
    METHOD_NAME: AssetTypeTreeMethod;
    METHOD_OPTIONS: MethodOptions;
}
export declare function assetTypeTreeHandler(req: CbServer.BasicReq, resp: CbServer.Resp, options: AssetTypeTreeOptions): void;
