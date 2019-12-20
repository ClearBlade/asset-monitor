"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var collection_lib_1 = require("../collection-lib");
var global_config_1 = require("../global-config");
function getAllAssetsForType(assetType) {
    console.log('in getAllAssets things');
    var assetsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
    var assetsCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
    assetsCollectionQuery.equalTo('type', assetType);
    var promise = assetsCollection.cbFetchPromise({ query: assetsCollectionQuery }).then(function (data) {
        return Array.isArray(data.DATA) ? data.DATA : [];
    });
    // @ts-ignore
    Promise.runQueue();
    return promise;
}
exports.getAllAssetsForType = getAllAssetsForType;
function getAllAreasForType(areaType) {
    console.log('in getAllAreas things');
    var areasCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.AREAS);
    var areasCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.AREAS });
    areasCollectionQuery.equalTo("type", areaType);
    var promise = areasCollection.cbFetchPromise({ query: areasCollectionQuery }).then(function (data) {
        return Array.isArray(data.DATA) ? data.DATA : [];
    });
    // @ts-ignore
    Promise.runQueue();
    return promise;
}
exports.getAllAreasForType = getAllAreasForType;
