"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
var collection_lib_1 = require("../collection-lib");
var tree_1 = require("./tree");
function removeNode(treeID, nodeID) {
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
    var removeNodePromise = getTree(treeID).then(performDelete);
    function performDelete(treeObj) {
        var tree = tree_1.CreateTree(treeObj);
        var removedTree = tree.removeChild(nodeID);
        var assetCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
        var assetIDs = removedTree.getSubtreeIDs(removedTree.rootID);
        var assetUpdateQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
        assetIDs.forEach(function (element) {
            var q = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
            q.equalTo('id', element);
            assetUpdateQuery.or(q);
        });
        var addToTreesCol = addNewTree(removedTree);
        var updateOldTree = updateTree(tree);
        var updateAssets = assetCol.cbUpdatePromise({
            query: assetUpdateQuery,
            changes: {
                treeID: removedTree.treeID,
            },
        });
        return Promise.all([addToTreesCol, updateOldTree, updateAssets])
            .then(function () {
            return Promise.resolve(removedTree);
        })
            .catch(function (rejection) {
            return Promise.reject(rejection);
        });
    }
    return removeNodePromise;
}
exports.removeNode = removeNode;
function getTree(treeID) {
    var fetchQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TREES }).equalTo('id', treeID);
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    var promise = treeCol
        .cbFetchPromise({
        query: fetchQuery,
    })
        .then(function (data) {
        if (!data.DATA) {
            return Promise.reject(new Error('.DATA is missing..'));
        }
        if (data.DATA.length != 1) {
            return Promise.reject(new Error(data.DATA.length + 'trees found for id ' + treeID));
        }
        var dataStr = data.DATA[0]['tree'];
        try {
            var treeObj = JSON.parse(dataStr);
            return Promise.resolve(treeObj);
        }
        catch (e) {
            return Promise.reject(new Error('Failed while parsing: ' + e.message));
        }
    });
    return promise;
}
exports.getTree = getTree;
function addNode(treeID, node, parentID) {
    // fetch node/asset's row
    // get it's old tree
    // & new tree
    // update tree_id column for it's entire lineage from old tree
    // update the new tree
    return getTree(treeID)
        .then(function (treeObj) {
        var tree = tree_1.CreateTree(treeObj);
        var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
        var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
        var updateQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TREES }).equalTo('id', treeID);
        var fetchQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS }).equalTo('id', node.id);
        assetsCol
            .cbFetchPromise({
            query: fetchQuery,
        })
            .then(function (data) {
            log('fetched Assets Collection Data..');
            log(data);
            if (!data.DATA) {
                return Promise.reject(new Error('.DATA is missing..'));
            }
            if (data.DATA.length != 1) {
                return Promise.reject(new Error(data.DATA.length + ' assets found for id'));
            }
            var treeID = data.DATA[0]['tree_id'];
            try {
                return Promise.resolve(treeID);
            }
            catch (e) {
                return Promise.reject(new Error('Failed while parsing: ' + e.message));
            }
        })
            .then(getTree)
            .then(function (assetsOldTreeObj) {
            log('fetched assetsOld tree: ' + node.id);
            log(assetsOldTreeObj);
            var assetsOldTree = tree_1.CreateTree(assetsOldTreeObj);
            var assetsToUpdate = assetsOldTree.getSubtreeIDs(node.id);
            var assetUpdateQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
            assetsToUpdate.forEach(function (element) {
                var q = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
                q.equalTo('id', element);
                assetUpdateQuery.or(q);
            });
            log('will update asset row for all lineage');
            log(assetsToUpdate);
            return assetsCol.cbUpdatePromise({
                query: assetUpdateQuery,
                changes: {
                    tree_id: tree.treeID,
                },
            });
        })
            .then(function () {
            log('adding child, finally');
            tree.addChild(node, parentID);
            var treeStr = {};
            try {
                treeStr = JSON.stringify(tree.getTree());
            }
            catch (e) {
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
        .catch(function (rejection) {
        return Promise.reject('Rejected in get Tree: ' + rejection);
    });
}
exports.addNode = addNode;
function addNewTree(newTree) {
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    var stringifiedTree = JSON.stringify({
        rootID: newTree.rootID,
        nodes: newTree.nodes,
    });
    var addToTreesCol = treeCol.cbCreatePromise({
        item: {
            id: newTree.treeID,
            tree: stringifiedTree,
        },
    });
    return addToTreesCol;
}
exports.addNewTree = addNewTree;
function updateTree(tree) {
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    var treeUpdateQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TREES }).equalTo('id', tree.treeID);
    var promise = treeCol.cbUpdatePromise({
        query: treeUpdateQuery,
        changes: {
            tree: tree.getTree(),
        },
    });
    return promise;
}
exports.updateTree = updateTree;
// export function moveNode<T>(srcID: string, destID: string, id: string): Promise<T> {
//     throw new Error('Method not implemented.');
// }
