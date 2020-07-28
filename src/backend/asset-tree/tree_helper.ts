import { AssetTree, AssetID, AssetTreeNode } from './tree';
import { AssetTreeSchema } from '../collection-schema/AssetTree';
import { CbCollectionLib } from '../collection-lib';
import { CollectionName } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import 'core-js/features/array';
import { RawQueryLib } from '../collection-lib/raw-query';

export function insertTree(newTree: AssetTree): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const treeStr = AssetTree.treeToString(newTree);
    const addToTreesCol = treeCol.cbCreatePromise({
        item: {
            id: newTree.treeID,
            tree: treeStr,
        },
    });
    return addToTreesCol;
}

export function removeTree(tree: AssetTree): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const removeQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', tree.treeID);

    return treeCol.cbRemovePromise({
        query: removeQuery,
    });
}

export function updateTree(tree: AssetTree): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    log('updateTree::: treeID', tree.treeID);
    const treeUpdateQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', tree.treeID);
    const treeStr = AssetTree.treeToString(tree);
    const promise = treeCol.cbUpdatePromise({
        query: treeUpdateQuery,
        changes: {
            tree: treeStr,
        },
    });

    return promise;
}

export function getTree(treeID: string): Promise<AssetTree> {
    const fetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', treeID);
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const promise = treeCol
        .cbFetchPromise({
            query: fetchQuery,
        })
        .then(function(data) {
            if (!data.DATA) {
                return Promise.reject(new Error('.DATA is missing..'));
            }
            if (data.DATA.length != 1) {
                return Promise.reject(new Error(data.DATA.length + 'trees found for id ' + treeID));
            }
            const treeStr = (data.DATA[0] as AssetTreeSchema) as string;

            try {
                const tree = AssetTree.treeFromString(treeStr);
                //treeObj.treeID = treeID;
                log('getTree::: ', tree);
                return Promise.resolve(tree);
            } catch (e) {
                return Promise.reject(new Error('Failed while parsing: ' + e.message));
            }
        });
    return promise;
}

export function getTreeIdForAsset(assetID: AssetID): Promise<string> {
    const assetsCol = CbCollectionLib(CollectionName.ASSETS);
    const fetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo('id', assetID);
    return assetsCol
        .cbFetchPromise({
            query: fetchQuery,
        })
        .then(function(data) {
            log('fetched Assets Collection Data..');
            log(data);
            if (!data.DATA) {
                return Promise.reject(new Error('.DATA is missing..'));
            }
            if (data.DATA.length != 1) {
                return Promise.reject(new Error(data.DATA.length + ' assets found for assetID ' + assetID));
            }
            const treeID: string = (data.DATA[0] as Asset)['tree_id'] as string;
            log('getTreeIdForAsset:: TreeID: ', treeID, 'for assetID: ', assetID);
            if (treeID === '') {
                return Promise.reject('TreeID is missing for asset');
            }
            return Promise.resolve(treeID);
        });
}

export function getTreeByAssetID(assetID: string): Promise<AssetTree> {
    return getTreeIdForAsset(assetID).then(getTree);
}

export function addChild<T>(parentID: string, child: AssetTreeNode): Promise<unknown> {
    return getTreeIdForAsset(parentID)
        .then(getTree)
        .then(
            function(parentTree: AssetTree) {
                parentTree.addChildLeaf(child, parentID);
                log('Added child to parentTree ', AssetTree.treeToString(parentTree));
                return updateTree(parentTree).then(function() {
                    return updateTreeIDForAssets(parentTree.treeID, [child.id]);
                });
            },
            function(reject) {
                log(
                    'In reject, that is: the parentID is not part of a tree, hence creating a new tree. Reject Message ',
                    reject,
                );
                const rootNode = AssetTree.createAssetNode(parentID);
                const tree = new AssetTree(rootNode);

                tree.addChildLeaf(child, parentID);
                return insertTree(tree).then(function() {
                    return updateTreeIDForAssets(tree.treeID, tree.getSubtreeIDs(tree.rootID));
                });
            },
        );
}

export function updateTreeIDForAssets(treeID: string, assets: Array<AssetID>): Promise<unknown> {
    const assetsCol = CbCollectionLib(CollectionName.ASSETS);
    const assetUpdateQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS });
    assets.forEach(element => {
        const q = ClearBlade.Query({ collectionName: CollectionName.ASSETS });
        q.equalTo('id', element);
        assetUpdateQuery.or(q);
    });
    log("will update asset row for the entire lineage, if an asset doesn't exist there's no error");
    log(assets);
    return assetsCol.cbUpdatePromise({
        query: assetUpdateQuery,
        changes: {
            tree_id: treeID,
        },
    });
}

export function moveChild(parentID: string, childNode: AssetTreeNode, currentTreeID: string): Promise<unknown> {
    const destTree = getTreeIdForAsset(parentID).then(getTree);

    const srcTree = getTree(currentTreeID);

    return Promise.all([destTree, srcTree]).then(function(resolved) {
        let destT = resolved[0];
        const srcT = resolved[1];
        const srcDestSame = destT.treeID === srcT.treeID;
        let treeToMove, updateTreePromise, removeTreePromise;
        const promises = [];

        if (childNode.id === srcT.rootID) {
            log('srcT root itself is the new childTree');
            treeToMove = srcT;
        } else {
            treeToMove = srcT.removeChild(childNode.id);
        }

        destT = srcDestSame ? srcT : destT;

        destT.addChildTree(treeToMove, parentID);
        const destTPromise = updateTree(destT);
        promises.push(destTPromise);
        if (srcT.size() <= 1 || childNode.id === srcT.rootID) {
            // remove entry from trees collection!!
            log("removing the src tree because either it's size is less than 1 or the root is moved.. ");
            removeTreePromise = removeTree(srcT).then(function() {
                return updateTreeIDForAssets('', [srcT.rootID]);
            });
            promises.push(removeTreePromise);
        } else if (!srcDestSame) {
            // update entry in trees collection
            updateTreePromise = updateTree(srcT);
            promises.push(updateTreePromise);
        }

        const assetsToUpdate = treeToMove.getSubtreeIDs(treeToMove.rootID);
        //const assetUpdatePromise = updateTreeIDForAssets(destT.treeID, assetsToUpdate);
        //promises.push(assetUpdatePromise);

        return Promise.all(promises).then(function() {
            return updateTreeIDForAssets(destT.treeID, assetsToUpdate);
        });
    });
}

export function removeChild(childID: string, treeID: string): Promise<unknown> {
    return getTree(treeID).then(function(tree) {
        try {
            let removedTree, updateTreePromise, addTreePromise, removeTreePromise;
            const promises = [];
            if (childID === tree.rootID) {
                log('childID same as rootID of the tree');
                removedTree = tree;
            } else {
                removedTree = tree.removeChild(childID);
                log('removedChild :: removedTree, removing child', AssetTree.treeToString(removedTree));
            }
            if (tree.size() <= 1 || childID === tree.rootID) {
                // remove entry from trees collection!!
                log('removeChild :: size of tree is less than 1 or child to remove is the root');
                removeTreePromise = removeTree(tree);
                promises.push(removeTreePromise);
            } else {
                // update entry in trees collection
                log('removeChild :: update entry in the trees collection');
                updateTreePromise = updateTree(tree);
                promises.push(updateTreePromise);
            }

            const assetsToUpdate = removedTree.getSubtreeIDs(removedTree.rootID);

            if (removedTree.size() > 1) {
                // add entry to trees collection
                log('removeChild :: Size of removed tree is greater than 1, add it as an new entry in the collection');
                addTreePromise = insertTree(removedTree);
                promises.push(addTreePromise);
                const assetUpdatePromise = updateTreeIDForAssets(removedTree.treeID, assetsToUpdate);
                promises.push(assetUpdatePromise);
            } else {
                log('removeChild :: Updating treeID to be empty string for these Assets');
                const assetUpdatePromise = updateTreeIDForAssets('', assetsToUpdate);
                promises.push(assetUpdatePromise);
            }

            return Promise.all(promises);
        } catch (e) {
            return Promise.reject(e.message);
        }
    });
}

export function getTopLevelAssets(resp: CbServer.Resp): void {
    // TODO: On availability of json column / json cast support, switch to single query.
    // const query = "WITH roots AS (SELECT tree::json->>'rootID' FROM asset_trees) SELECT * FROM assets WHERE id IN roots;";

    RawQueryLib()
        .cbQueryPromise({ query: 'SELECT tree FROM asset_trees' })
        .then(function(res) {
            const topLevelAssetIDs = new Array<AssetID>();
            (res as { tree: string }[]).forEach(item => {
                topLevelAssetIDs.push(JSON.parse(item.tree).rootID);
            });

            const idString = `(${topLevelAssetIDs.map(assetID => `"${assetID}"`).join(',')})`;
            const assetQuery = `SELECT * FROM assets WHERE id IN ${idString}`;

            return RawQueryLib().cbQueryPromise({ query: assetQuery });
        })
        .then(function(res) {
            resp.success(res);
        })
        .catch(err => {
            resp.error(err);
        });
}

export enum AssetTreeMethod {
    GET_TREE = 'getTree',
    GET_TOP_LEVEL_ASSETS = 'getTopLevelAssets',
    CREATE_ASSET_TREE = 'createAssetTree',
    ADD_CHILD = 'addChild',
    REMOVE_CHILD = 'removeChild',
    MOVE_CHILD = 'moveChild',
}

interface AssetTreeNodeDict {
    [id: string]: AssetTreeNode;
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
    CURRENT_TREE_ID: string;
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

export type AssetTreeOperations =
    | CreateOperation
    | AddChildOperation
    | RemoveChildOperation
    | MoveChildOperation
    | GetTopLevelAssetsOperation;

export function assetTreeHandler(req: CbServer.BasicReq, resp: CbServer.Resp, options: AssetTreeOperations): void {
    log('in handler');
    switch (options.METHOD) {
        case AssetTreeMethod.CREATE_ASSET_TREE:
            handleCreate(options.METHOD_OPTIONS);
            break;
        case AssetTreeMethod.ADD_CHILD:
            handleAddChild(options.METHOD_OPTIONS);
            break;
        case AssetTreeMethod.REMOVE_CHILD:
            handleRemoveChild(options.METHOD_OPTIONS);
            break;
        case AssetTreeMethod.MOVE_CHILD:
            handleMoveChild(options.METHOD_OPTIONS);
            break;
        case AssetTreeMethod.GET_TOP_LEVEL_ASSETS:
            getTopLevelAssets(resp);
            break;
        default:
            break;
    }

    Promise.runQueue();

    function handleCreate(options: CreateAssetTreeOptions) {
        const rootNodeID = options.ROOT_ID;
        log(Object.keys(options.NODES));
        log(Object.keys(options.NODES).map(k => [k, options.NODES[k]]));
        const nodes = new Map(Object.keys(options.NODES).map(k => [k, options.NODES[k]]));

        const rootNode = nodes.get(rootNodeID);
        if (!rootNode) {
            resp.error('Root node is missing.');
        }

        const tree = new AssetTree(rootNode, undefined, nodes);

        log('logging tree');
        log(AssetTree.treeToString(tree));
        log(tree.treeID);
        log('In tree create');
        insertTree(tree)
            .then(function() {
                return updateTreeIDForAssets(tree.treeID, tree.getSubtreeIDs(tree.rootID));
            })
            .then(successFn)
            .catch(failureFn);
    }

    function handleAddChild(options: AddChildOptions) {
        log('Addding new child');
        log(options);
        addChild(options.PARENT_ID, options.CHILD_NODE).then(successFn, failureFn);
    }

    function handleRemoveChild(options: RemoveChildOptions) {
        // log('Removing a child/subTree');
        // log(options);
        removeChild(options.CHILD_ID, options.TREE_ID).then(successFn, failureFn);
    }

    function handleMoveChild(options: MoveChildOptions) {
        moveChild(options.PARENT_ID, options.CHILD_NODE, options.CURRENT_TREE_ID)
            .then(successFn)
            .then(failureFn);
    }

    function successFn(data: unknown) {
        resp.success(data);
    }
    function failureFn(data: unknown) {
        resp.error(data);
    }
}
