"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var collection_lib_1 = require("../collection-lib");
var global_config_1 = require("../global-config");
var utils_1 = require("./utils");
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
function compareAssetsOrAreas(oldEntities, newEntities) {
    var oldKeys = utils_1.uniqueArray(Object.keys(oldEntities));
    var newKeys = utils_1.uniqueArray(Object.keys(newEntities));
    var additions = [];
    var hasOverlap = false;
    for (var i = 0; i < newKeys.length; i++) {
        var oldIndex = oldKeys.indexOf(newKeys[i]);
        if (oldIndex > -1) {
            oldKeys.splice(oldIndex, 1);
            hasOverlap = true;
        }
        else {
            additions.push(newKeys[i]);
        }
    }
    if (!oldKeys.length && !additions.length) {
        return true; // all ids are overlapping - do nothing
    }
    else if (hasOverlap) {
        return additions; // need to update existing event with additions
    }
    else {
        return false; // no overlaps - need to keep looking or make new event
    }
}
function aggregateEntities(newEntities, oldEntities) {
    return __assign(__assign({}, oldEntities), newEntities);
}
function compareOverlappingEntities(event, splitEntities) {
    var existingAssets = JSON.parse(event.assets || '{}');
    var existingAreas = JSON.parse(event.areas || '{}');
    var assetAdditions = compareAssetsOrAreas(existingAssets, splitEntities.assets);
    var areaAdditions = compareAssetsOrAreas(existingAreas, splitEntities.areas);
    if (Array.isArray(assetAdditions) ||
        Array.isArray(areaAdditions) ||
        (assetAdditions && !areaAdditions) ||
        (!assetAdditions && areaAdditions)) {
        return {
            assets: aggregateEntities(splitEntities.assets, existingAssets),
            areas: aggregateEntities(splitEntities.areas, existingAreas),
        };
    }
    return assetAdditions && areaAdditions;
}
exports.compareOverlappingEntities = compareOverlappingEntities;
function updateEvent(id, entities) {
    var eventsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENTS);
    var query = ClearBlade.Query().equalTo('id', id);
    var changes = {
        assets: entities.assets,
        areas: entities.areas,
    };
    eventsCollection.cbUpdatePromise({ query: query, changes: changes });
}
function shouldCreateOrUpdateEvent(ruleID, splitEntities) {
    // if overlapping entities with existing event for rule, then update with added entities or do nothing if none added, else create new
    var eventsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENTS);
    var query = ClearBlade.Query({ collectionName: global_config_1.CollectionName.EVENTS })
        .equalTo('rule_id', ruleID)
        .equalTo('is_open', true);
    var promise = eventsCollection
        .cbFetchPromise({ query: query })
        .then(function (data) {
        var openEvents = data.DATA;
        for (var i = 0; i < openEvents.length; i++) {
            var hasOverlappingEntities = compareOverlappingEntities(openEvents[i], splitEntities);
            if (hasOverlappingEntities) {
                if (typeof hasOverlappingEntities === 'object') {
                    updateEvent(openEvents[i].id, hasOverlappingEntities);
                }
                return false;
            }
        }
        return true;
    });
    Promise.runQueue();
    return promise;
}
exports.shouldCreateOrUpdateEvent = shouldCreateOrUpdateEvent;
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
function closeRules(ids, splitEntities) {
    if (ids.length) {
        var shouldProceed_1 = false;
        var promise = Promise.all(ids.map(function (id) {
            var rulesCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.RULES);
            var query = ClearBlade.Query().equalTo('id', id);
            var promise = rulesCollection
                .cbFetchPromise({ query: query })
                .then(function (data) {
                var state = JSON.parse(data.DATA[0].closed_by_rule || '{}').state;
                var eventsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.EVENTS);
                var query = ClearBlade.Query()
                    .equalTo('rule_id', id)
                    .equalTo('is_open', true);
                var promise = eventsCollection
                    .cbFetchPromise({ query: query })
                    .then(function (data) {
                    for (var i = 0; i < data.DATA.length; i++) {
                        var hasOverlappingEntities = compareOverlappingEntities(data.DATA[i], splitEntities);
                        if (hasOverlappingEntities) {
                            shouldProceed_1 = true;
                            var query_1 = ClearBlade.Query().equalTo('id', data.DATA[i].id);
                            return eventsCollection.cbUpdatePromise({
                                query: query_1,
                                changes: { state: state, is_open: false },
                            });
                        }
                    }
                });
                Promise.runQueue();
                return promise;
            });
            Promise.runQueue();
            return promise;
        })).then(function () {
            return shouldProceed_1;
        });
        Promise.runQueue();
        return promise;
    }
    return new Promise(function (res) { return res(true); });
}
exports.closeRules = closeRules;
