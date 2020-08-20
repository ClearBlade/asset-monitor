import { AssetType } from '../collection-schema/AssetType';
import { AssetTypeID } from './assetTypeTree';
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
}
export interface DeleteAssetTypeOptions {
    ASSET_TYPE_ID: AssetTypeID;
}
export interface AddOrRemoveChildOptions {
    CHILD_ID: AssetTypeID;
    PARENT_ID: AssetTypeID;
}
interface CreateOperation {
    METHOD: AssetTypeTreeMethod.CREATE_ASSET_TYPE;
    METHOD_OPTIONS: CreateAssetTypeOptions;
}
interface DeleteOperation {
    METHOD: AssetTypeTreeMethod.DELETE_ASSET_TYPE;
    METHOD_OPTIONS: DeleteAssetTypeOptions;
}
interface AddChildOperation {
    METHOD: AssetTypeTreeMethod.ADD_CHILD;
    METHOD_OPTIONS: AddOrRemoveChildOptions;
}
interface RemoveChildOperation {
    METHOD: AssetTypeTreeMethod.REMOVE_CHILD;
    METHOD_OPTIONS: AddOrRemoveChildOptions;
}
interface GetTreeOperation {
    METHOD: AssetTypeTreeMethod.GET_TREE;
}
interface GetTopLevelAssetTypesOperation {
    METHOD: AssetTypeTreeMethod.GET_TOP_LEVEL_ASSET_TYPES;
}
export declare type AssetTypeTreeOperations = CreateOperation | DeleteOperation | AddChildOperation | RemoveChildOperation | GetTreeOperation | GetTopLevelAssetTypesOperation;
export declare function assetTypeTreeHandler(req: CbServer.BasicReq, resp: CbServer.Resp, options: AssetTypeTreeOperations): void;
export {};
