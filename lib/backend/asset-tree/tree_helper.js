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
        var tree = tree_1.CreateNewTree(treeObj);
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
                treeID: removedTree.id,
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
function addNode(treeID, node, parentID) {
    return getTree(treeID)
        .then(function (treeObj) {
        var tree = tree_1.CreateNewTree(treeObj);
        tree.addChild(node, parentID);
        return Promise.resolve(tree);
    })
        .catch(function (rejection) {
        return Promise.reject(rejection);
    });
}
exports.addNode = addNode;
function getTree(treeID) {
    var fetchQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TREES }).equalTo('id', treeID);
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    var promise = treeCol
        .cbFetchPromise({
        query: fetchQuery,
    })
        .then(function (data) {
        if (data.DATA.length != 1) {
            return Promise.reject(new Error(data.DATA.length + 'trees found for id ' + treeID));
        }
        var dataStr = data.DATA[0]['tree'];
        try {
            //const treeObj = JSON.parse(dataStr);
            return Promise.resolve(dataStr);
        }
        catch (e) {
            console.log('error while parsing', e);
            return Promise.reject(new Error('Failed while parsing: ' + e.message));
        }
    });
    return promise;
}
exports.getTree = getTree;
function addNewTree(newTree) {
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    var flattenedTree = JSON.stringify({
        rootID: newTree.rootID,
        nodes: newTree.nodes,
    });
    var addToTreesCol = treeCol.cbCreatePromise({
        item: {
            id: newTree.id,
            tree: flattenedTree,
        },
    });
    return addToTreesCol;
}
exports.addNewTree = addNewTree;
function updateTree(tree) {
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    var treeUpdateQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TREES }).equalTo('id', tree.id);
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
