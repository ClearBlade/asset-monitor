import { CollectionName } from '../global-config';
import { CbCollectionLib } from '../collection-lib';
import { AssetTree } from '../collection-schema/AssetTree';
import { TreeNode, Tree, CreateNewTree, Trees } from './tree';

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
        const tree = CreateNewTree(treeObj as Trees<TreeNode>);
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
                treeID: removedTree.id,
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

export function addNode<T>(treeID: string, node: TreeNode, parentID: string): Promise<Tree<TreeNode>> {
    return getTree(treeID)
        .then(function(treeObj) {
            const tree = CreateNewTree(treeObj as Trees<TreeNode>);
            tree.addChild(node, parentID);
            log('Inside add node child method');
            log(tree.getTree());
            return Promise.resolve(tree);
        })
        .catch(function(rejection) {
            return Promise.reject('Rejected in get Tree' + rejection);
        });
}

export function getTree(treeID: string): Promise<Trees<TreeNode>> {
    const fetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', treeID);
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const promise = treeCol
        .cbFetchPromise({
            query: fetchQuery,
        })
        .then(function(data) {
            if (data.DATA.length != 1) {
                return Promise.reject(new Error(data.DATA.length + 'trees found for id ' + treeID));
            }
            const dataStr = (data.DATA[0] as AssetTree)['tree'] as Trees<TreeNode>;
            try {
                //const treeObj = JSON.parse(dataStr);
                return Promise.resolve(dataStr);
            } catch (e) {
                console.log('error while parsing', e);
                return Promise.reject(new Error('Failed while parsing: ' + e.message));
            }
        });
    return promise;
}

export function addNewTree(newTree: Tree<TreeNode>): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const flattenedTree = JSON.stringify({
        rootID: newTree.rootID,
        nodes: newTree.nodes,
    });
    const addToTreesCol = treeCol.cbCreatePromise({
        item: {
            id: newTree.id,
            tree: flattenedTree,
        },
    });
    return addToTreesCol;
}

export function updateTree(tree: Tree<TreeNode>): Promise<unknown> {
    const treeCol = CbCollectionLib(CollectionName.ASSET_TREES);
    const treeUpdateQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TREES }).equalTo('id', tree.id);

    const promise = treeCol.cbUpdatePromise({
        query: treeUpdateQuery,
        changes: {
            tree: tree.getTree(),
        },
    });

    return promise;
}

// export function moveNode<T>(srcID: string, destID: string, id: string): Promise<T> {
//     throw new Error('Method not implemented.');
// }
