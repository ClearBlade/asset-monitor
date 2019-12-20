import { Params } from './types';
import { CbCollectionLib } from '../collection-lib';
import { CollectionName } from '../global-config';
import { Actions, ActionTypes } from '../collection-schema/Actions';
import '../../static/promise-polyfill';

// @ts-ignore
const ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
const log: { (s: any): void } = global.log;

export function FireEventsAndActions(params: Params) {
    processEvents(params);
    processActions(params);
}

function processEvents(params: Params) {}

function processActions(params: Params) {
    const actionTypeIDs: Array<string> = params.actionIDs;
    for (const idx in actionTypeIDs) {
        const action: Actions = getActionByID(actionTypeIDs[idx]);
        log('Action is ' + JSON.stringify(action));
        performAction(action);
    }
}

function getActionByID(actionID: string): Actions {
    const actionsCollection = CbCollectionLib(CollectionName.ACTIONS);
    const actionsCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.ACTIONS });
    actionsCollectionQuery.equalTo('id', actionID);

    if (actionsCollection) {
        actionsCollection.cbFetchPromise({ query: actionsCollectionQuery }).then(data => {
            return Array.isArray(data.DATA) && data.DATA[0] ? data.DATA[0] : {};
        });
        // @ts-ignore
        Promise.runQueue();
    }
    return {};
}

function performAction(action: Actions) {
    switch (action.type) {
        case ActionTypes.SEND_SMS:
        // send sms
        case ActionTypes.SEND_EMAIL:
        // send email
        case ActionTypes.PUBLISH_MESSAGE:
        // publish message
    }
}
