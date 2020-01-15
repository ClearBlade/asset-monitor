import { Event } from 'json-rules-engine';
import { Entities, processEvent } from '../events';
import { EventSchema } from '../../collection-schema/Events';
import * as uuid from 'uuid/v4';
jest.mock('../async');
jest.mock('uuid/v4');

const event: Event = {
    type: 'Test Event',
    params: {
        eventTypeID: 'type1',
        actionIDs: [],
        priority: 1,
        severity: 2,
        ruleID: 'rule1',
        ruleName: 'Rule One',
    },
};

const entities: Entities = {
    entityOne: {
        id: 'EntityOne',
    },
    entityTwo: {
        id: 'EntityTwo',
    },
    entityThree: {
        id: 'EntityThree',
        polygon: '[]',
    },
};

const mockedTimestamp = '2020-01-07T21:58:20.610Z';
const mockedUUID = 'UUID';

const finishedEvent: EventSchema = {
    last_updated: mockedTimestamp,
    is_open: false,
    label: `type1_${mockedUUID}`,
    severity: 2,
    id: mockedUUID,
    type: 'type1',
    state: 'Closed',
    priority: 1,
    action_ids: '[]',
    rule_id: 'rule1',
    assets: '{"entityOne":{"id":"EntityOne"},"entityTwo":{"id":"EntityTwo"}}',
    areas: '{"entityThree":{"id":"EntityThree","polygon":"[]"}}',
};

describe('Events For Rules', () => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockedTimestamp);
    // @ts-ignore
    uuid.mockImplementation(() => mockedUUID);
    it('processEvent processes event correctly after async calls', () => {
        return processEvent(event, entities, '').then(eventResult => {
            expect(eventResult).toEqual(finishedEvent);
        });
    });
});
