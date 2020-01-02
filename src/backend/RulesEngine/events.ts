import { Params } from './types';
import { CbCollectionLib } from '../collection-lib';
import { CollectionName } from '../global-config';
import { Actions, ActionTypes } from '../collection-schema/Actions';
import '../../static/promise-polyfill';
import { Event } from 'json-rules-engine';

function processEvents(event: Event): void {
    console.log(event);
}

function getActionByID(actionID: string): Actions {
    const actionsCollection = CbCollectionLib(CollectionName.ACTIONS);
    const actionsCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.ACTIONS });
    actionsCollectionQuery.equalTo('id', actionID);

    if (actionsCollection) {
        actionsCollection.cbFetchPromise({ query: actionsCollectionQuery }).then(data => {
            return Array.isArray(data.DATA) && data.DATA[0] ? data.DATA[0] : {};
        });
        Promise.runQueue();
    }
    return {};
}

function performAction(action: Actions): void {
    switch (action.type) {
        case ActionTypes.SEND_SMS:
            // send sms
            break;
        case ActionTypes.SEND_EMAIL:
            // send email
            break;
        case ActionTypes.PUBLISH_MESSAGE:
            // publish message
            break;
    }
}

function processActions(event: Event): void {
    const actionTypeIDs: Array<string> = (event.params as Params).actionIDs;
    for (const idx in actionTypeIDs) {
        const action: Actions = getActionByID(actionTypeIDs[idx]);
        // log('Action is ' + JSON.stringify(action));
        performAction(action);
    }
}

export function FireEventsAndActions(event: Event): void {
    processEvents(event);
    processActions(event);
}
