"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var collection_lib_1 = require("../collection-lib");
var global_config_1 = require("../global-config");
function getAllAssetsForType(assetType) {
    var assetsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ASSETS);
    var assetsCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSETS });
    assetsCollectionQuery.equalTo('type', assetType);
    var promise = assetsCollection.cbFetchPromise({ query: assetsCollectionQuery }).then(function (data) {
        return Array.isArray(data.DATA) ? data.DATA : [];
    });
    Promise.runQueue();
    return promise;
}
exports.getAllAssetsForType = getAllAssetsForType;
function getAllAreasForType(areaType) {
    var areasCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.AREAS);
    var areasCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.AREAS });
    areasCollectionQuery.equalTo('type', areaType);
    var promise = areasCollection.cbFetchPromise({ query: areasCollectionQuery }).then(function (data) {
        return Array.isArray(data.DATA) ? data.DATA : [];
    });
    Promise.runQueue();
    return promise;
}
exports.getAllAreasForType = getAllAreasForType;
function getActionByID(actionID) {
    var actionsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ACTIONS);
    var actionsCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ACTIONS }).equalTo('id', actionID);
    var promise = actionsCollection.cbFetchPromise({ query: actionsCollectionQuery }).then(function (data) {
        return Array.isArray(data.DATA) && data.DATA[0] ? data.DATA[0] : {};
    });
    Promise.runQueue();
    return promise;
}
exports.getActionByID = getActionByID;
function getOpenStateForEvent(eventTypeId) {
    var eventTypesCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENT_TYPES);
    var eventTypesCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.EVENT_TYPES }).equalTo('id', eventTypeId);
    var promise = eventTypesCollection
        .cbFetchPromise({ query: eventTypesCollectionQuery })
        .then(function (data) {
        var typeData = Array.isArray(data.DATA) && data.DATA[0];
        return typeData && !!typeData.has_lifecycle && JSON.parse(typeData.open_states || '[]').length
            ? JSON.parse(typeData.open_states)[0]
            : '';
    });
    Promise.runQueue();
    return promise;
}
exports.getOpenStateForEvent = getOpenStateForEvent;
function createEvent(item) {
    var eventsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENTS);
    return eventsCollection.cbCreatePromise({ item: item });
}
exports.createEvent = createEvent;
