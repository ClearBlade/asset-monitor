import { Params, Action, ActionTypes } from "./types";

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;

export function FireEventsAndActions(params: Params) {
    processEvents(params);
    processActions(params);
}

function processEvents(params: Params) {

}

function processActions(params: Params) {
    let actionTypeIDs: Array<string> = params.actionIDs;
    for(let idx in actionTypeIDs) {
        let action: Action = getActionByID(actionTypeIDs[idx]);
        log("Action is " + JSON.stringify(action));
        performAction(action);
    }
}

function getActionByID(actionID: string): Action {
    let action: Action = undefined;
    let collection = ClearBlade.Collection({collectionName: "actions"});
    let query = ClearBlade.Query();
    query.equalTo("id", actionID);
    collection.fetch(query, function(err, data) {
        if(err) {
            log("Error getting action for ID (" + actionID + "): " + JSON.stringify(data));
        } else {
            action = data.DATA[0] as Action;
        }
    });
    return action;
}

function performAction(action: Action) {
    switch(action.type) {
        case ActionTypes.SEND_SMS:
            // send sms
        case ActionTypes.SEND_EMAIL:
            // send email
        case ActionTypes.PUBLISH_MESSAGE:
            // publish message
    }
}