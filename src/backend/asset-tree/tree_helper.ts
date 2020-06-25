import { CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { AssetTree } from '../collection-schema/AssetTree';
import { TreeNode, Tree, CreateTree, Trees, OrphanTreeNode } from './tree';
import { Asset } from '../collection-schema/Assets';

export function createTree(newTree: Tree<TreeNode>): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const stringifiedTree = JSON.stringify({
        rootID: newTree.rootID,
        nodes: newTree.nodes,
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
    const treeUpdateQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', tree.treeID);

    const promise = treeCol.cbUpdatePromise({
        query: treeUpdateQuery,
        changes: {
            tree: tree.getTree(),
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
                const treeObj = JSON.parse(dataStr) as Trees<TreeNode>;
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
                return Promise.reject(new Error(data.DATA.length + ' assets found for id'));
            }
            const treeID: string = (data.DATA[0] as Asset)['tree_id'] as string;
            try {
                return Promise.resolve(treeID);
            } catch (e) {
                return Promise.reject(new Error('Failed while parsing: ' + e.message));
            }
        });
}

export function getTreeByAssetID(assetID: string): Promise<Tree<TreeNode>> {
    return getTreeIdForAsset(assetID).then(getTree);
}

export function addChild<T>(parentID: string, child: OrphanTreeNode): Promise<Tree<TreeNode>> {
    return getTreeByAssetID(parentID).then(function(parentTree: Tree<TreeNode>) {
        return Promise.resolve(parentTree.addChild(child, parentID));
    });
}

export function updateTreeIDForAssets(treeID: string, assets: Array<string>): Promise<unknown> {
    const assetsCol = CbCollectionLib(CollectionName.ASSETS);
    const assetUpdateQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS });
    assets.forEach(element => {
        const q = ClearBlade.Query({ collectionName: CollectionName.ASSETS });
        q.equalTo('id', element);
        assetUpdateQuery.or(q);
    });
    log('will update asset row for all lineage');
    log(assets);
    return assetsCol.cbUpdatePromise({
        query: assetUpdateQuery,
        changes: {
            tree_id: treeID,
        },
    });
}

export function moveNode<T>(parentID: string, child: TreeNode, currentTreeID: string): Promise<unknown> {
    const destTree = getTreeIdForAsset(parentID).then(getTree);

    const srcTree = getTree(currentTreeID);

    Promise.all([destTree, srcTree]).then(function(resolved) {
        let destT = resolved[0];
        const srcT = resolved[1];
        const srcDestSame = destT.treeID === srcT.treeID;
        let treeToMove, removedTree, updateTreePromise, addTreePromise, removeTreePromise;
        const promises = [];

        if (child.id === srcT.rootID) {
            treeToMove = srcT;
        } else {
            treeToMove = srcT.removeChild(child.id);
        }

        destT = srcDestSame ? srcT : destT;

        destT.addChildTree(treeToMove, parentID);
        const destTPromise = updateTree(destT);
        promises.push(destTPromise);
        if (srcT.size() <= 1) {
            // remove entry from trees collection!!
            log('srcTree size is less than 1, oops');
            removeTreePromise = removeTree(srcT);
            promises.push(removeTreePromise);
        } else if (!srcDestSame) {
            // update entry in trees collection
            updateTreePromise = updateTree(srcT);
            promises.push(updateTreePromise);
        }

        const assetsToUpdate = treeToMove.getSubtreeIDs(treeToMove.rootID);
        const assetUpdatePromise = updateTreeIDForAssets(destT.treeID, assetsToUpdate);
        promises.push(assetUpdatePromise);

        return Promise.all(promises);
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
                removedTree = tree;
            } else {
                removedTree = tree.removeChild(childID);
            }
            if (tree.size() <= 1) {
                // remove entry from trees collection!!
                removeTreePromise = removeTree(tree);
                promises.push(removeTreePromise);
            } else {
                // update entry in trees collection
                updateTreePromise = updateTree(tree);
                promises.push(updateTreePromise);
            }
            if (removedTree.size() > 1) {
                // add entry to trees collection
                addTreePromise = createTree(removedTree);
                promises.push(addTreePromise);
            }

            const assetsToUpdate = removedTree.getSubtreeIDs(removedTree.rootID);
            const assetUpdatePromise = updateTreeIDForAssets(removedTree.treeID, assetsToUpdate);
            promises.push(assetUpdatePromise);

            return Promise.all(promises);
        } catch (e) {
            return Promise.reject(e.message);
        }
    });
}

// need to create a remove child helper for remove tree and move tree
