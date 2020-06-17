import { CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { AssetTree } from '../collection-schema/AssetTree';
import { TreeNode, Tree, CreateTree, Trees } from './tree';
import { Asset } from '../collection-schema/Assets';

export function removeNode<T>(treeID: string, nodeID: string): Promise<Tree<TreeNode>> {
    // fetch the tree row
    // create a tree out of it
    // remove a subtree from it, can be just a node...
    // create a new tree using that subtree
    // add it to the trees collection
    // update the treeID column for all the elements(assets) of the subtree
    // update the trees collection for the current tree
    // return the node (with the subtree)
    // .catch(function(reject) {
    //     console.log('Top Level Reject: ', reject);
    // });
    const removeNodePromise = getTree(treeID).then(performDelete);

    function performDelete(treeObj: Trees<TreeNode>): Promise<Tree<TreeNode>> {
        const tree = CreateTree(treeObj as Trees<TreeNode>);
        const removedTree = tree.removeChild(nodeID);
        const assetCol = CbCollectionLib(CollectionName.ASSETS);
        const assetIDs = removedTree.getSubtreeIDs(removedTree.rootID);
        const assetUpdateQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS });
        assetIDs.forEach(element => {
            const q = ClearBlade.Query({ collectionName: CollectionName.ASSETS });
            q.equalTo('id', element);
            assetUpdateQuery.or(q);
        });

        const addToTreesCol = addNewTree(removedTree);
        const updateOldTree = updateTree(tree);
        const updateAssets = assetCol.cbUpdatePromise({
            query: assetUpdateQuery,
            changes: {
                treeID: removedTree.treeID,
            },
        });

        return Promise.all([addToTreesCol, updateOldTree, updateAssets])
            .then(function() {
                return Promise.resolve(removedTree);
            })
            .catch(function(rejection) {
                return Promise.reject(rejection);
            });
    }
    return removeNodePromise;
}

export function getTree(treeID: string): Promise<Trees<TreeNode>> {
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
                return Promise.resolve(treeObj);
            } catch (e) {
                return Promise.reject(new Error('Failed while parsing: ' + e.message));
            }
        });
    return promise;
}

export function addNode<T>(treeID: string, node: TreeNode, parentID: string): Promise<Tree<TreeNode>> {
    // fetch node/asset's row
    // get it's old tree
    // & new tree
    // update tree_id column for it's entire lineage from old tree
    // update the new tree

    return getTree(treeID)
        .then(function(treeObj) {
            const tree = CreateTree(treeObj as Trees<TreeNode>);
            const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
            const assetsCol = CbCollectionLib(CollectionName.ASSETS);

            const updateQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', treeID);
            const fetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS }).equalTo('id', node.id);

            assetsCol
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
                })
                .then(getTree)
                .then(function(assetsOldTreeObj: Trees<TreeNode>) {
                    log('fetched assetsOld tree: ' + node.id);
                    log(assetsOldTreeObj);
                    const assetsOldTree = CreateTree(assetsOldTreeObj);
                    const assetsToUpdate = assetsOldTree.getSubtreeIDs(node.id);
                    return updateTreeIDForAssets(tree.treeID, assetsToUpdate);
                })
                .then(function() {
                    log('adding child, finally');
                    tree.addChild(node, parentID);
                    let treeStr = {};
                    try {
                        treeStr = JSON.stringify(tree.getTree());
                    } catch (e) {
                        return Promise.reject('Rejected in get Tree: ' + e);
                    }
                    log('updating the tree now');
                    return treeCol.cbUpdatePromise({
                        query: updateQuery,
                        changes: {
                            tree: treeStr,
                        },
                    });
                });

            //update the current and downstream assets' treeID column
            return Promise.resolve(tree);
        })
        .catch(function(rejection) {
            return Promise.reject('Rejected in get Tree: ' + rejection);
        });
}

export function addNewTree(newTree: Tree<TreeNode>): Promise<unknown> {
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

// export function moveNode<T>(srcID: string, destID: string, id: string): Promise<T> {
//     throw new Error('Method not implemented.');
// }
