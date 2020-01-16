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
function objectsAreEqual(oldEntity, newEntity) {
    var oldKeys = Object.keys(oldEntity).sort();
    var newKeys = Object.keys(newEntity).sort();
    //@ts-ignore
    log('Old keys ' + JSON.stringify(oldKeys));
    //@ts-ignore
    log('new keys ' + JSON.stringify(newKeys));
    return JSON.stringify(oldKeys) === JSON.stringify(newKeys);
}
function entitiesAreEqual(event, splitEntities) {
    var existingAssets = JSON.parse(event.assets || '{}');
    var existingAreas = JSON.parse(event.areas || '{}');
    return objectsAreEqual(existingAssets, splitEntities.assets) && objectsAreEqual(existingAreas, splitEntities.areas);
}
exports.entitiesAreEqual = entitiesAreEqual;
function shouldCreateEvent(ruleID, splitEntities) {
    var eventsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENTS);
    var query = ClearBlade.Query({ collectionName: global_config_1.CollectionName.EVENTS })
        .equalTo('rule_id', ruleID)
        .equalTo('is_open', true);
    var promise = eventsCollection
        .cbFetchPromise({ query: query })
        .then(function (data) {
        var openEvents = data.DATA;
        for (var i = 0; i < openEvents.length; i++) {
            if (entitiesAreEqual(openEvents[i], splitEntities)) {
                return false;
            }
        }
        return true;
    });
    Promise.runQueue();
    return promise;
}
exports.shouldCreateEvent = shouldCreateEvent;
function getStateForEvent(eventTypeId) {
    var eventTypesCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENT_TYPES);
    var eventTypesCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.EVENT_TYPES }).equalTo('id', eventTypeId);
    var promise = eventTypesCollection
        .cbFetchPromise({ query: eventTypesCollectionQuery })
        .then(function (data) {
        var typeData = Array.isArray(data.DATA) && data.DATA[0];
        if (typeData && !!typeData.has_lifecycle) {
            var openState = JSON.parse(typeData.open_states || '[]')[0];
            if (openState) {
                return { is_open: true, state: openState };
            }
            var closedState = JSON.parse(typeData.closed_states || '[]')[0];
            if (closedState) {
                return { is_open: false, state: closedState };
            }
        }
        return {
            is_open: false,
            state: '',
        };
    });
    Promise.runQueue();
    return promise;
}
exports.getStateForEvent = getStateForEvent;
function createEvent(item) {
    var eventsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENTS);
    return eventsCollection.cbCreatePromise({ item: item });
}
exports.createEvent = createEvent;
function createEventHistoryItem(item) {
    var eventHistoryCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENT_HISTORY);
    return eventHistoryCollection.cbCreatePromise({ item: item });
}
exports.createEventHistoryItem = createEventHistoryItem;
