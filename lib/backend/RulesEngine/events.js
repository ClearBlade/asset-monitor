"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var collection_lib_1 = require("../collection-lib");
var global_config_1 = require("../global-config");
var Actions_1 = require("../collection-schema/Actions");
require("../../static/promise-polyfill");
function processEvents(event) {
    console.log(event);
}
function getActionByID(actionID) {
    var actionsCollection = collection_lib_1.CbCollectionLib(global_config_1.CollectionName.ACTIONS);
    var actionsCollectionQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ACTIONS });
    actionsCollectionQuery.equalTo('id', actionID);
    if (actionsCollection) {
        actionsCollection.cbFetchPromise({ query: actionsCollectionQuery }).then(function (data) {
            return Array.isArray(data.DATA) && data.DATA[0] ? data.DATA[0] : {};
        });
        Promise.runQueue();
    }
    return {};
}
function performAction(action) {
    switch (action.type) {
        case Actions_1.ActionTypes.SEND_SMS:
            // send sms
            break;
        case Actions_1.ActionTypes.SEND_EMAIL:
            // send email
            break;
        case Actions_1.ActionTypes.PUBLISH_MESSAGE:
            // publish message
            break;
    }
}
function processActions(event) {
    var actionTypeIDs = event.params.actionIDs;
    for (var idx in actionTypeIDs) {
        var action = getActionByID(actionTypeIDs[idx]);
        // log('Action is ' + JSON.stringify(action));
        performAction(action);
    }
}
function FireEventsAndActions(event) {
    processEvents(event);
    processActions(event);
}
exports.FireEventsAndActions = FireEventsAndActions;
