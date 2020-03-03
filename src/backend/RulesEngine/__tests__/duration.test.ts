import { DurationEngine, Timers } from '../DurationEngine';
import { ProcessedCondition, RuleParams, Entities, WithParsedCustomData } from '../types';

const timerId = 'testTimerId';
const mockTime = 12345;

beforeAll(() => {
    jest.spyOn(DurationEngine.prototype, 'startTimerAndGetId').mockImplementation(
        (): Promise<string> => {
            return new Promise(res => res(timerId));
        },
    );
    jest.spyOn(global.Date, 'now').mockReturnValue(mockTime);
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('Duration For Rules', () => {
    it('creates new timer object, starts timer, and updates cache', () => {
        const engine = new DurationEngine(mockCache);
        return engine
            .processDurations(incomingCombinations, incomingRuleParams, entities, actionTopic, incomingData)
            .then(() => {
                expect(timerCache).toEqual({
                    testRule1: storedTimers,
                });
            });
    });
    it('updates conditions for existing timer in cache when lower duration becomes true', () => {
        const engine = new DurationEngine(mockCache);
        return engine
            .processDurations(incomingCombinationsTwo, incomingRuleParams, entities, actionTopic, incomingDataTwo)
            .then(() => {
                expect(timerCache).toEqual({
                    testRule1: storedTimersTwo,
                });
            });
    });
    it('clears rule from cache when timed entity becomes false and no other durations exist', () => {
        const engine = new DurationEngine(mockCache);
        return engine
            .processDurations(incomingCombinationsThree, incomingRuleParams, entities, actionTopic, incomingDataThree)
            .then(() => {
                expect(timerCache).toEqual({});
            });
    });
    it('has a test', () => {
        expect(true).toBeTruthy();
    });
});

const timerCache: { [x: string]: Timers } = {};

const mockCache = {
    timerCache,
    get: (ruleId, callback): void => {
        callback(false, timerCache[ruleId]);
    },
    set: (ruleId, newTimers): void => {
        timerCache[ruleId] = newTimers;
    },
    delete: (ruleId): void => {
        delete timerCache[ruleId];
    },
};

const incomingCombinations: Array<ProcessedCondition[]> = [
    [
        {
            duration: 1000,
            id: 'testAsset1',
            associatedId: '',
            result: true,
            timerStart: 0,
        },
        {
            duration: 0,
            id: 'testAsset2',
            associatedId: '',
            result: false,
            timerStart: 0,
        },
    ],
];

const incomingCombinationsTwo: Array<ProcessedCondition[]> = [
    [
        {
            duration: 1000,
            id: 'testAsset1',
            associatedId: '',
            result: true,
            timerStart: 0,
        },
        {
            duration: 0,
            id: 'testAsset2',
            associatedId: '',
            result: true,
            timerStart: mockTime,
        },
    ],
];

const incomingCombinationsThree: Array<ProcessedCondition[]> = [
    [
        {
            duration: 1000,
            id: 'testAsset1',
            associatedId: '',
            result: false,
            timerStart: 0,
        },
        {
            duration: 0,
            id: 'testAsset2',
            associatedId: '',
            result: true,
            timerStart: mockTime,
        },
    ],
];

const incomingRuleParams: RuleParams = {
    actionIDs: [],
    eventTypeID: '',
    priority: 0,
    ruleID: 'testRule1',
    ruleName: 'testRule1',
    ruleType: 'any',
    severity: 0,
    closesIds: [],
};

const entities: Entities = {
    testAsset1: {
        id: 'testAsset1',
    },
    testAsset2: {
        id: 'testAsset2',
    },
};

const actionTopic = 'testActionTopic';

const incomingData: WithParsedCustomData = {
    id: 'testAsset1',
    custom_data: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        speed: 60,
    },
};

const incomingDataTwo: WithParsedCustomData = {
    id: 'testAsset2',
    custom_data: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        temp: 80,
    },
};

const incomingDataThree: WithParsedCustomData = {
    id: 'testAsset1',
    custom_data: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        speed: 50,
    },
};

const storedTimers: Timers = {
    testAsset1testAsset2: {
        conditions: incomingCombinations[0],
        entities,
        actionTopic,
        incomingData,
        ruleParams: incomingRuleParams,
        timerId,
        timedEntity: {
            ...incomingCombinations[0][0],
            timerStart: mockTime,
        },
    },
};

const storedTimersTwo: Timers = {
    testAsset1testAsset2: {
        conditions: incomingCombinationsTwo[0],
        entities,
        actionTopic,
        incomingData,
        ruleParams: incomingRuleParams,
        timerId,
        timedEntity: {
            ...incomingCombinationsTwo[0][0],
            timerStart: mockTime,
        },
    },
};
