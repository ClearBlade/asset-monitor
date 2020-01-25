import { Event } from 'json-rules-engine';
import { processEvent } from '../events';
import { EventSchema } from '../../collection-schema/Events';
import * as uuid from 'uuid/v4';
import { Entities, SplitEntities } from '../async';
import { RuleParams } from '../types';

jest.mock('../async');
jest.mock('uuid/v4');
const { entitiesAreEqual } = jest.requireActual('../async');

const mockedTimestamp = '2020-01-07T21:58:20.610Z';
const mockedUUID = 'UUID';

describe('Events For Rules', () => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockedTimestamp);
    // @ts-ignore
    uuid.mockImplementation(() => mockedUUID);
    it('entity check returns true if entities are equal', () => {
        expect(entitiesAreEqual(existingEventMatch, incomingEvent)).toBe(true);
    });

    it('entity check returns false if entities are not equal', () => {
        expect(entitiesAreEqual(existingEventUnmatch, incomingEvent)).toBe(false);
    });

    it('processEvent processes event correctly after async calls', () => {
        return processEvent(event.params as RuleParams, entities, '', entities.entityOne as Entities).then(
            eventResult => {
                expect(eventResult).toEqual(finishedEvent);
            },
        );
    });
});

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

const existingEventMatch: EventSchema = {
    assets: finishedEvent.assets,
    areas: finishedEvent.areas,
};

const existingEventUnmatch: EventSchema = {
    assets: finishedEvent.assets,
    areas: '{"entityFour":{"id":"EntityFour","polygon":"[]"}}',
};

const incomingEvent: SplitEntities = {
    assets: {
        entityOne: entities.entityOne,
        entityTwo: entities.entityTwo,
    },
    areas: {
        entityThree: entities.entityThree,
    },
};

describe('Events For Rules', () => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockedTimestamp);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore jest types don't include mockImplementation
    uuid.mockImplementation(() => mockedUUID);
    it('entity check returns true if entities are equal', () => {
        expect(entitiesAreEqual(existingEventMatch, incomingEvent)).toBe(true);
    });

    it('entity check returns false if entities are not equal', () => {
        expect(entitiesAreEqual(existingEventUnmatch, incomingEvent)).toBe(false);
    });

    it('processEvent processes event correctly after async calls', () => {
        return processEvent(event.params as RuleParams, entities, '', entities.entityOne as Entities).then(
            eventResult => {
                expect(eventResult).toEqual(finishedEvent);
            },
        );
    });
});
