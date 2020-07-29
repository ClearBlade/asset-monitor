import { AssetTree, AssetID, AssetTreeNode, AssetTreeNodeDict } from './tree';
import 'core-js/features/array';
export declare function insertTree(newTree: AssetTree): Promise<unknown>;
export declare function removeTree(tree: AssetTree): Promise<unknown>;
export declare function updateTree(tree: AssetTree): Promise<unknown>;
export declare function getTree(treeID: string): Promise<AssetTree>;
export declare function getTreeIdForAsset(assetID: AssetID): Promise<string>;
export declare function getTreeByAssetID(assetID: string): Promise<AssetTree>;
export declare function addChild(parentID: string, child: AssetTreeNode): Promise<unknown>;
export declare function updateTreeIDForAssets(treeID: string, assets: Array<AssetID>): Promise<unknown>;
export declare function moveChild(parentID: string, childNode: AssetTreeNode, childTreeID: string): Promise<unknown>;
export declare function removeChild(childID: string, treeID: string): Promise<unknown>;
export declare function getTopLevelAssets(resp: CbServer.Resp): void;
export declare enum AssetTreeMethod {
    GET_TREE = "getTree",
    GET_TOP_LEVEL_ASSETS = "getTopLevelAssets",
    CREATE_ASSET_TREE = "createAssetTree",
    ADD_CHILD = "addChild",
    REMOVE_CHILD = "removeChild",
    MOVE_CHILD = "moveChild"
}
export interface CreateAssetTreeOptions {
    ROOT_ID: AssetID;
    NODES: AssetTreeNodeDict;
}
export interface AddChildOptions {
    PARENT_ID: string;
    CHILD_NODE: AssetTreeNode;
}
export interface RemoveChildOptions {
    CHILD_ID: string;
    TREE_ID: string;
}
export interface MoveChildOptions {
    PARENT_ID: string;
    CHILD_NODE: AssetTreeNode;
    CHILD_TREE_ID: string;
}
export interface GetTreeOptions {
    TREE_ID: string;
}
export interface CreateOperation {
    METHOD: AssetTreeMethod.CREATE_ASSET_TREE;
    METHOD_OPTIONS: CreateAssetTreeOptions;
}
export interface AddChildOperation {
    METHOD: AssetTreeMethod.ADD_CHILD;
    METHOD_OPTIONS: AddChildOptions;
}
export interface RemoveChildOperation {
    METHOD: AssetTreeMethod.REMOVE_CHILD;
    METHOD_OPTIONS: RemoveChildOptions;
}
export interface MoveChildOperation {
    METHOD: AssetTreeMethod.MOVE_CHILD;
    METHOD_OPTIONS: MoveChildOptions;
}
export interface GetTopLevelAssetsOperation {
    METHOD: AssetTreeMethod.GET_TOP_LEVEL_ASSETS;
}
export interface GetTreeOperation {
    METHOD: AssetTreeMethod.GET_TREE;
    METHOD_OPTIONS: GetTreeOptions;
}
export declare type AssetTreeOperations = CreateOperation | AddChildOperation | RemoveChildOperation | MoveChildOperation | GetTopLevelAssetsOperation | GetTreeOperation;
export declare function assetTreeHandler(req: CbServer.BasicReq, resp: CbServer.Resp, options: AssetTreeOperations): void;
