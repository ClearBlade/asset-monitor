"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tree_1 = require("./tree");
var collection_lib_1 = require("../collection-lib");
var global_config_1 = require("../global-config");
require("core-js/features/array");
var raw_query_1 = require("../collection-lib/raw-query");
function insertTree(newTree) {
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    var treeStr = tree_1.AssetTree.treeToString(newTree);
    var addToTreesCol = treeCol.cbCreatePromise({
        item: {
            id: newTree.treeID,
            tree: treeStr,
        },
    });
    return addToTreesCol;
}
exports.insertTree = insertTree;
function removeTree(tree) {
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    var removeQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TREES }).equalTo('id', tree.treeID);
    return treeCol.cbRemovePromise({
        query: removeQuery,
    });
}
exports.removeTree = removeTree;
function updateTree(tree) {
    var treeCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TREES);
    log('updateTree::: treeID', tree.treeID);
    var treeUpdateQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TREES }).equalTo('id', tree.treeID);
    var treeStr = tree_1.AssetTree.treeToString(tree);
    var promise = treeCol.cbUpdatePromise({
        query: treeUpdateQuery,
        changes: {
            tree: treeStr,
        },
    });
    return promise;
}
exports.updateTree = updateTree;
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
        var treeStr = data.DATA[0];
        try {
            var tree = tree_1.AssetTree.treeFromString(treeStr);
            //treeObj.treeID = treeID;
            log('getTree::: ', tree);
            return Promise.resolve(tree);
        }
        catch (e) {
            return Promise.reject(new Error('Failed while parsing: ' + e.message));
        }
    });
    return promise;
}
exports.getTree = getTree;
function getTreeIdForAsset(assetID) {
    var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
    var fetchQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS }).equalTo('id', assetID);
    return assetsCol
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
            return Promise.reject(new Error(data.DATA.length + ' assets found for assetID ' + assetID));
        }
        var treeID = data.DATA[0]['tree_id'];
        log('getTreeIdForAsset:: TreeID: ', treeID, 'for assetID: ', assetID);
        if (treeID === '') {
            return Promise.reject('TreeID is missing for asset');
        }
        return Promise.resolve(treeID);
    });
}
exports.getTreeIdForAsset = getTreeIdForAsset;
function getTreeByAssetID(assetID) {
    return getTreeIdForAsset(assetID).then(getTree);
}
exports.getTreeByAssetID = getTreeByAssetID;
function addChild(parentID, child) {
    return getTreeIdForAsset(parentID)
        .then(getTree)
        .then(function (parentTree) {
        parentTree.addChildLeaf(child, parentID);
        log('Added child to parentTree ', tree_1.AssetTree.treeToString(parentTree));
        return updateTree(parentTree).then(function () {
            return updateTreeIDForAssets(parentTree.treeID, [child.id]);
        });
    }, function (reject) {
        log('In reject, that is: the parentID is not part of a tree, hence creating a new tree. Reject Message ', reject);
        var rootNode = tree_1.AssetTree.createAssetNode(parentID);
        var tree = new tree_1.AssetTree(rootNode);
        tree.addChildLeaf(child, parentID);
        return insertTree(tree).then(function () {
            return updateTreeIDForAssets(tree.treeID, tree.getSubtreeIDs(tree.rootID));
        });
    });
}
exports.addChild = addChild;
function updateTreeIDForAssets(treeID, assets) {
    var assetsCol = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
    var assetUpdateQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
    assets.forEach(function (element) {
        var q = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
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
exports.updateTreeIDForAssets = updateTreeIDForAssets;
function moveChild(parentID, childNode, currentTreeID) {
    var destTree = getTreeIdForAsset(parentID).then(getTree);
    var srcTree = getTree(currentTreeID);
    return Promise.all([destTree, srcTree]).then(function (resolved) {
        var destT = resolved[0];
        var srcT = resolved[1];
        var srcDestSame = destT.treeID === srcT.treeID;
        var treeToMove, updateTreePromise, removeTreePromise;
        var promises = [];
        if (childNode.id === srcT.rootID) {
            log('srcT root itself is the new childTree');
            treeToMove = srcT;
        }
        else {
            treeToMove = srcT.removeChild(childNode.id);
        }
        destT = srcDestSame ? srcT : destT;
        destT.addChildTree(treeToMove, parentID);
        var destTPromise = updateTree(destT);
        promises.push(destTPromise);
        if (srcT.size() <= 1 || childNode.id === srcT.rootID) {
            // remove entry from trees collection!!
            log("removing the src tree because either it's size is less than 1 or the root is moved.. ");
            removeTreePromise = removeTree(srcT).then(function () {
                return updateTreeIDForAssets('', [srcT.rootID]);
            });
            promises.push(removeTreePromise);
        }
        else if (!srcDestSame) {
            // update entry in trees collection
            updateTreePromise = updateTree(srcT);
            promises.push(updateTreePromise);
        }
        var assetsToUpdate = treeToMove.getSubtreeIDs(treeToMove.rootID);
        //const assetUpdatePromise = updateTreeIDForAssets(destT.treeID, assetsToUpdate);
        //promises.push(assetUpdatePromise);
        return Promise.all(promises).then(function () {
            return updateTreeIDForAssets(destT.treeID, assetsToUpdate);
        });
    });
}
exports.moveChild = moveChild;
function removeChild(childID, treeID) {
    return getTree(treeID).then(function (tree) {
        try {
            var removedTree = void 0, updateTreePromise = void 0, addTreePromise = void 0, removeTreePromise = void 0;
            var promises = [];
            if (childID === tree.rootID) {
                log('childID same as rootID of the tree');
                removedTree = tree;
            }
            else {
                removedTree = tree.removeChild(childID);
                log('removedChild :: removedTree, removing child', tree_1.AssetTree.treeToString(removedTree));
            }
            if (tree.size() <= 1 || childID === tree.rootID) {
                // remove entry from trees collection!!
                log('removeChild :: size of tree is less than 1 or child to remove is the root');
                removeTreePromise = removeTree(tree);
                promises.push(removeTreePromise);
            }
            else {
                // update entry in trees collection
                log('removeChild :: update entry in the trees collection');
                updateTreePromise = updateTree(tree);
                promises.push(updateTreePromise);
            }
            var assetsToUpdate = removedTree.getSubtreeIDs(removedTree.rootID);
            if (removedTree.size() > 1) {
                // add entry to trees collection
                log('removeChild :: Size of removed tree is greater than 1, add it as an new entry in the collection');
                addTreePromise = insertTree(removedTree);
                promises.push(addTreePromise);
                var assetUpdatePromise = updateTreeIDForAssets(removedTree.treeID, assetsToUpdate);
                promises.push(assetUpdatePromise);
            }
            else {
                log('removeChild :: Updating treeID to be empty string for these Assets');
                var assetUpdatePromise = updateTreeIDForAssets('', assetsToUpdate);
                promises.push(assetUpdatePromise);
            }
            return Promise.all(promises);
        }
        catch (e) {
            return Promise.reject(e.message);
        }
    });
}
exports.removeChild = removeChild;
function getTopLevelAssets(resp) {
    // TODO: On availability of json column / json cast support, switch to single query.
    // const query = "WITH roots AS (SELECT tree::json->>'rootID' FROM asset_trees) SELECT * FROM assets WHERE id IN roots;";
    raw_query_1.RawQueryLib()
        .cbQueryPromise({ query: 'SELECT tree FROM asset_trees' })
        .then(function (res) {
        var topLevelAssetIDs = new Array();
        res.forEach(function (item) {
            topLevelAssetIDs.push(JSON.parse(item.tree).rootID);
        });
        var idString = "(" + topLevelAssetIDs.map(function (assetID) { return "\"" + assetID + "\""; }).join(',') + ")";
        var assetQuery = "SELECT * FROM assets WHERE id IN " + idString;
        return raw_query_1.RawQueryLib().cbQueryPromise({ query: assetQuery });
    })
        .then(function (res) {
        resp.success(res);
    })
        .catch(function (err) {
        resp.error(err);
    });
}
exports.getTopLevelAssets = getTopLevelAssets;
var AssetTreeMethod;
(function (AssetTreeMethod) {
    AssetTreeMethod["GET_TREE"] = "getTree";
    AssetTreeMethod["GET_TOP_LEVEL_ASSETS"] = "getTopLevelAssets";
    AssetTreeMethod["CREATE_ASSET_TREE"] = "createAssetTree";
    AssetTreeMethod["ADD_CHILD"] = "addChild";
    AssetTreeMethod["REMOVE_CHILD"] = "removeChild";
    AssetTreeMethod["MOVE_CHILD"] = "moveChild";
})(AssetTreeMethod = exports.AssetTreeMethod || (exports.AssetTreeMethod = {}));
function assetTreeHandler(req, resp, options) {
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
    function handleCreate(options) {
        var rootNodeID = options.ROOT_ID;
        log(Object.keys(options.NODES));
        log(Object.keys(options.NODES).map(function (k) { return [k, options.NODES[k]]; }));
        var nodes = new Map(Object.keys(options.NODES).map(function (k) { return [k, options.NODES[k]]; }));
        var rootNode = nodes.get(rootNodeID);
        if (!rootNode) {
            resp.error('Root node is missing.');
        }
        var tree = new tree_1.AssetTree(rootNode, undefined, nodes);
        log('logging tree');
        log(tree_1.AssetTree.treeToString(tree));
        log(tree.treeID);
        log('In tree create');
        insertTree(tree)
            .then(function () {
            return updateTreeIDForAssets(tree.treeID, tree.getSubtreeIDs(tree.rootID));
        })
            .then(successFn)
            .catch(failureFn);
    }
    function handleAddChild(options) {
        log('Addding new child');
        log(options);
        addChild(options.PARENT_ID, options.CHILD_NODE).then(successFn, failureFn);
    }
    function handleRemoveChild(options) {
        // log('Removing a child/subTree');
        // log(options);
        removeChild(options.CHILD_ID, options.TREE_ID).then(successFn, failureFn);
    }
    function handleMoveChild(options) {
        moveChild(options.PARENT_ID, options.CHILD_NODE, options.CURRENT_TREE_ID)
            .then(successFn)
            .then(failureFn);
    }
    function successFn(data) {
        resp.success(data);
    }
    function failureFn(data) {
        resp.error(data);
    }
}
exports.assetTreeHandler = assetTreeHandler;
