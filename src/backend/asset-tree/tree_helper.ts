import { CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { AssetTree } from '../collection-schema/AssetTree';
import { TreeNode, Tree, CreateTree, Trees, OrphanTreeNode, ConvertToTreeNode } from './tree';
import { Asset } from '../collection-schema/Assets';

export function insertTree(newTree: Tree<TreeNode>): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const stringifiedTree = JSON.stringify({
        rootID: newTree.rootID,
        nodes: newTree.nodes,
        treeID: newTree.treeID,
    });
    const addToTreesCol = treeCol.cbCreatePromise({
        item: {
            id: newTree.treeID,
            tree: stringifiedTree,
        },
    });
    return addToTreesCol;
}

export function removeTree(tree: Tree<TreeNode>): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const removeQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', tree.treeID);

    return treeCol.cbRemovePromise({
        query: removeQuery,
    });
}

export function updateTree(tree: Tree<TreeNode>): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    log('updateTree::: treeID', tree.treeID);
    const treeUpdateQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', tree.treeID);
    const treeStr = JSON.stringify(tree.getTree());
    const promise = treeCol.cbUpdatePromise({
        query: treeUpdateQuery,
        changes: {
            tree: treeStr,
        },
    });

    return promise;
}

export function getTree(treeID: string): Promise<Tree<TreeNode>> {
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
            const dataStr = (data.DATA[0] as AssetTree)['tree'] as string;
            try {
                const treeObj = JSON.parse(dataStr);
                //treeObj.treeID = treeID;
                log('getTree::: ', treeObj);
                const tree = CreateTree(treeObj as Trees<TreeNode>);
                return Promise.resolve(tree);
            } catch (e) {
                return Promise.reject(new Error('Failed while parsing: ' + e.message));
            }
        });
    return promise;
}

export function getTreeIdForAsset(assetID: string): Promise<string> {
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

export function getTreeByAssetID(assetID: string): Promise<Tree<TreeNode>> {
    return getTreeIdForAsset(assetID).then(getTree);
}

export function addChild<T>(parentID: string, child: OrphanTreeNode): Promise<unknown> {
    return getTreeIdForAsset(parentID)
        .then(getTree)
        .then(
            function(parentTree: Tree<TreeNode>) {
                parentTree.addChild(child, parentID);
                log('Added child to parentTree ', parentTree.getTree());
                return updateTree(parentTree).then(function() {
                    return updateTreeIDForAssets(parentTree.treeID, [child.id]);
                });
            },
            function(reject) {
                log(
                    'In reject, that is: the parentID is not part of a tree, hence creating a new tree. Reject Message ',
                    reject,
                );
                const treeNode = ConvertToTreeNode({ id: parentID, meta: {} });
                const nodes: Map<string, TreeNode> = new Map();
                nodes.set(parentID, treeNode);
                const baseTree = CreateTree({
                    nodes,
                    rootID: parentID,
                    treeID: '',
                });
                baseTree.addChild(child, parentID);
                return insertTree(baseTree).then(function() {
                    return updateTreeIDForAssets(baseTree.treeID, baseTree.getSubtreeIDs(baseTree.rootID));
                });
            },
        );
}

export function updateTreeIDForAssets(treeID: string, assets: Array<string>): Promise<unknown> {
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

export function moveChild<T>(parentID: string, child: TreeNode, currentTreeID: string): Promise<unknown> {
    const destTree = getTreeIdForAsset(parentID).then(getTree);

    const srcTree = getTree(currentTreeID);

    return Promise.all([destTree, srcTree]).then(function(resolved) {
        let destT = resolved[0];
        const srcT = resolved[1];
        const srcDestSame = destT.treeID === srcT.treeID;
        let treeToMove, updateTreePromise, removeTreePromise;
        const promises = [];

        if (child.id === srcT.rootID) {
            log('srcT root itself is the new childTree');
            treeToMove = srcT;
        } else {
            treeToMove = srcT.removeChild(child.id);
        }

        destT = srcDestSame ? srcT : destT;

        destT.addChildTree(treeToMove, parentID);
        const destTPromise = updateTree(destT);
        promises.push(destTPromise);
        if (srcT.size() <= 1 || child.id === srcT.rootID) {
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

// remove an assetNode or an entire subtree
// if it's a subTree we create a new entry in the trees collection
// otherwise it just gets removed from it current tree
// if there are only two nodes in a tree & I remove one, then I delete the tree?
export function removeChild<T>(childID: string, treeID: string): Promise<unknown> {
    return getTree(treeID).then(function(tree) {
        try {
            let removedTree, updateTreePromise, addTreePromise, removeTreePromise;
            const promises = [];
            if (childID === tree.rootID) {
                log('childID same as rootID of the tree');
                removedTree = tree;
            } else {
                removedTree = tree.removeChild(childID);
                log('removedChild :: removedTree, removing child', removedTree.getTree());
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

// fetch all the rootIDs
// write a query to get all those assets and assets with no treeIDs in their treeIDs column
// Assumption: All the assets with no treeIDs are top level assets too.
export function getTopLevelAssets(query: CbServer.Query): Promise<unknown> {
    const db = ClearBlade.Database();
    const getTreeQuery = 'select tree from asset_trees;';
    db.query(getTreeQuery, function(err, data) {
        if (err) {
            resp.error('Parse error : ' + JSON.stringify(data));
        } else {
            resp.success(data);
        }
    });
}
