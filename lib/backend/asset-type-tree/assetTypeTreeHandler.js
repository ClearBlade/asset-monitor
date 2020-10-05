"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assetTypeTree_1 = require("./assetTypeTree");
var global_config_1 = require("../global-config");
var raw_query_1 = require("../collection-lib/raw-query");
var collection_lib_1 = require("../collection-lib");
function fetchTree() {
    return raw_query_1.RawQueryLib()
        .cbQueryPromise({ query: 'SELECT tree FROM asset_type_tree' })
        .then(function (data) {
        if (data.length > 1) {
            return Promise.reject('Error: There is more than one asset type tree in the collection; there should only be one.');
        }
        var assetTypeTree = assetTypeTree_1.AssetTypeTree.treeFromString(data[0].tree);
        return Promise.resolve(assetTypeTree);
    });
}
function updateAssetTypeTreeCollection(assetTypeTree) {
    var query = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TYPE_TREE });
    query.limit = 1;
    return collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TYPE_TREE)
        .cbUpdatePromise({
        query: query,
        changes: {
            tree: assetTypeTree_1.AssetTypeTree.treeToString(assetTypeTree),
        },
    })
        .then(function () { return Promise.resolve(assetTypeTree); });
}
function syncAssetTypeTreeWithAssetTypes(assetTypeTree) {
    return raw_query_1.RawQueryLib()
        .cbQueryPromise({ query: 'SELECT id FROM asset_types' })
        .then(function (data) {
        var typesFromAssetTypesCollection = new Set(data.map(function (assetType) {
            if (assetType.id) {
                return assetType.id;
            }
        }));
        var typesFromTree = new Set(Object.keys(assetTypeTree.nodes));
        // Types added to the asset_types collection that are not in the tree yet.
        var typesToAddToTree = Array.from(typesFromAssetTypesCollection).filter(function (x) { return !typesFromTree.has(x); });
        typesToAddToTree.forEach(function (assetTypeID) {
            if (assetTypeID) {
                assetTypeTree.addAssetTypeToTree(assetTypeID);
            }
        });
        // Types removed from the asset_types collection that need to be removed from the tree.
        var typesToRemoveFromTree = Array.from(typesFromTree).filter(function (x) { return !typesFromAssetTypesCollection.has(x); });
        typesToRemoveFromTree.forEach(function (assetTypeID) {
            if (assetTypeID) {
                assetTypeTree.deleteAssetTypeFromTree(assetTypeID);
            }
        });
        return updateAssetTypeTreeCollection(assetTypeTree);
    });
}
function handleTrigger(assetTypeTree, req) {
    var trigger = req.params.trigger;
    var assetTypeIDs;
    if (trigger === 'Data::ItemCreated') {
        var assetTypeItemIDs = req.params['items'].map(function (item) { return item.item_id; });
        var idString = "(" + assetTypeItemIDs.map(function (itemID) { return "\"" + itemID + "\""; }).join(',') + ")";
        var query = "SELECT id FROM asset_types WHERE item_id IN " + idString;
        return raw_query_1.RawQueryLib()
            .cbQueryPromise({ query: query })
            .then(function (data) {
            assetTypeIDs = data.map(function (assetType) { return assetType.id; });
            assetTypeIDs.forEach(function (assetTypeID) {
                if (assetTypeID) {
                    assetTypeTree.addAssetTypeToTree(assetTypeID);
                }
            });
            return updateAssetTypeTreeCollection(assetTypeTree);
        })
            .then(function () {
            log(trigger + "\n" + assetTypeIDs);
            return Promise.resolve(trigger);
        });
    }
    else if (trigger === 'Data::ItemDeleted') {
        assetTypeIDs = req.params['items'].map(function (assetType) { return assetType.id; });
        assetTypeIDs.forEach(function (assetTypeID) {
            if (assetTypeID) {
                assetTypeTree.deleteAssetTypeFromTree(assetTypeID);
            }
        });
        return updateAssetTypeTreeCollection(assetTypeTree).then(function () {
            log(trigger + "\n" + assetTypeIDs);
            return Promise.resolve(trigger);
        });
    }
    else {
        return Promise.reject(trigger + " not handled.");
    }
}
function createAssetType(assetTypeTree, createAssetTypeOptions) {
    var assetType = createAssetTypeOptions.ASSET_TYPE;
    var assetTypeID = assetType.id;
    if (assetTypeID) {
        assetTypeTree.addAssetTypeToTree(assetTypeID);
        return addToAssetTypesCollection(assetType)
            .then(function () { return updateAssetTypeTreeCollection(assetTypeTree); })
            .then(function () { return Promise.resolve(assetTypeID + " created."); });
    }
    else {
        return Promise.reject('Error: Missing asset type id.');
    }
}
function deleteAssetType(assetTypeTree, deleteAssetTypeoptions) {
    var assetTypeID = deleteAssetTypeoptions.ASSET_TYPE_ID;
    assetTypeTree.deleteAssetTypeFromTree(assetTypeID);
    return deleteFromAssetTypesCollection(assetTypeID)
        .then(function () { return updateAssetTypeTreeCollection(assetTypeTree); })
        .then(function () { return Promise.resolve(assetTypeID + " deleted."); });
}
function addChild(assetTypeTree, options) {
    assetTypeTree.addChild(options.CHILD_ID, options.PARENT_ID);
    return updateAssetTypeTreeCollection(assetTypeTree).then(function () { return Promise.resolve('Child added.'); });
}
function removeChild(assetTypeTree, options) {
    assetTypeTree.removeChild(options.CHILD_ID, options.PARENT_ID);
    return updateAssetTypeTreeCollection(assetTypeTree).then(function () { return Promise.resolve("Child removed."); });
}
function addToAssetTypesCollection(assetType) {
    return collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TYPES).cbCreatePromise({
        item: {
            id: assetType.id,
            label: assetType.label,
            description: assetType.description,
            icon: assetType.icon,
            schema: assetType.schema,
        },
    });
}
function deleteFromAssetTypesCollection(assetTypeID) {
    return collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSET_TYPES).cbRemovePromise({
        query: ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TYPES }).equalTo('id', assetTypeID),
    });
}
function getTopLevelAssetTypes(assetTypeTree) {
    var topLevelAssetTypesIDs = assetTypeTree.getTopLevelAssetTypeIDs();
    var idString = "(" + topLevelAssetTypesIDs.map(function (assetID) { return "\"" + assetID + "\""; }).join(',') + ")";
    var query = "SELECT * FROM asset_types WHERE id in " + idString;
    return raw_query_1.RawQueryLib()
        .cbQueryPromise({ query: query })
        .then(function (data) {
        return Promise.resolve(data);
    });
}
var AssetTypeTreeMethod;
(function (AssetTypeTreeMethod) {
    AssetTypeTreeMethod["GET_TREE"] = "getTree";
    AssetTypeTreeMethod["GET_TOP_LEVEL_ASSET_TYPES"] = "getTopLevelAssetTypes";
    AssetTypeTreeMethod["CREATE_ASSET_TYPE"] = "createAssetType";
    AssetTypeTreeMethod["DELETE_ASSET_TYPE"] = "deleteAssetType";
    AssetTypeTreeMethod["ADD_CHILD"] = "addChild";
    AssetTypeTreeMethod["REMOVE_CHILD"] = "removeChild";
})(AssetTypeTreeMethod = exports.AssetTypeTreeMethod || (exports.AssetTypeTreeMethod = {}));
function assetTypeTreeHandler(req, resp, options) {
    var _a, _b;
    var successFn = function (data) { return resp.success(data); };
    var errorFn = function (data) { return resp.error(data); };
    var trigger = req.params.trigger;
    if (!((_a = options) === null || _a === void 0 ? void 0 : _a.METHOD) && !trigger)
        errorFn('Missing operation method.');
    var initPromise = fetchTree().then(function (assetTypeTree) {
        if (!trigger) {
            return syncAssetTypeTreeWithAssetTypes(assetTypeTree);
        }
        else {
            return handleTrigger(assetTypeTree, req).then(successFn, errorFn);
        }
    });
    switch ((_b = options) === null || _b === void 0 ? void 0 : _b.METHOD) {
        case AssetTypeTreeMethod.GET_TREE:
            initPromise.then(function (assetTypeTree) { return assetTypeTree_1.AssetTypeTree.treeToString(assetTypeTree); }).then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.GET_TOP_LEVEL_ASSET_TYPES:
            initPromise.then(function (assetTypeTree) { return getTopLevelAssetTypes(assetTypeTree); }).then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.CREATE_ASSET_TYPE:
            initPromise
                .then(function (assetTypeTree) { return createAssetType(assetTypeTree, options.METHOD_OPTIONS); })
                .then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.DELETE_ASSET_TYPE:
            initPromise
                .then(function (assetTypeTree) { return deleteAssetType(assetTypeTree, options.METHOD_OPTIONS); })
                .then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.REMOVE_CHILD:
            initPromise
                .then(function (assetTypeTree) { return removeChild(assetTypeTree, options.METHOD_OPTIONS); })
                .then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.ADD_CHILD:
            initPromise.then(function (assetTypeTree) { return addChild(assetTypeTree, options.METHOD_OPTIONS); }).then(successFn, errorFn);
            break;
        default:
            if (!trigger)
                errorFn('Unsupported method provided.');
            break;
    }
    Promise.runQueue();
}
exports.assetTypeTreeHandler = assetTypeTreeHandler;
