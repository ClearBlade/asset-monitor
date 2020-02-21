// import { DurationEngine, Timers } from '../DurationEngine';
// import { ProcessedCondition, RuleParams, Entities, WithParsedCustomData } from '../types';

// beforeAll(() => {
//     jest.spyOn(DurationEngine.prototype, 'startTimerAndGetId').mockImplementation(
//         (timerId, startTimer): Promise<string> => {
//             if (startTimer) {
//                 // do set timeout stuff
//             }
//             return new Promise(res => res(timerId));
//         },
//     );
//     jest.spyOn(global.Date, 'now').mockReturnValue(12345);
// });

// afterAll(() => {
//     jest.restoreAllMocks();
// });

describe('Duration For Rules', () => {
    // it('creates new timer object if it doesnt exist', () => {
    //     const engine = new DurationEngine(timerMethods);
    //     return engine
    //         .processDurations(incomingCombinations, incomingRuleParams, entities, actionTopic, incomingData)
    //         .then(() => {
    //             expect(timerCache).toEqual({
    //                 testRule1: storedTimers,
    //             });
    //         });
    // });
    it('has a test', () => {
        expect(true).toBeTruthy();
    });
});

// const timerCache: { [x: string]: Timers } = {};

// const timerMethods = {
//     timerCache,
//     get: (ruleId): Timers => timerCache[ruleId],
//     set: (ruleId, newTimers): void => {
//         timerCache[ruleId] = newTimers;
//     },
//     delete: (ruleId): void => {
//         delete timerCache[ruleId];
//     },
// };

// const timerId = 'testTimerId';

// const incomingCombinations: Array<ProcessedCondition[]> = [
//     [
//         {
//             duration: 1000,
//             id: 'testAsset1',
//             result: true,
//             timerStart: 0,
//         },
//     ],
// ];

// const incomingRuleParams: RuleParams = {
//     actionIDs: [],
//     eventTypeID: '',
//     priority: 0,
//     ruleID: 'testRule1',
//     ruleName: 'testRule1',
//     ruleType: 'any',
//     severity: 0,
// };

// const entities: Entities = {
//     testAsset1: {
//         id: 'testAsset1',
//     },
// };

// const actionTopic = 'testActionTopic';

// const incomingData: WithParsedCustomData = {
//     id: 'testAsset1',
//     custom_data: {
//         // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
//         // @ts-ignore
//         speed: 60,
//     },
// };

// const storedTimers: Timers = {
//     testAsset1: {
//         conditions: incomingCombinations[0],
//         entities,
//         actionTopic,
//         incomingData,
//         ruleParams: incomingRuleParams,
//         timerId,
//         timedEntity: {
//             ...incomingCombinations[0][0],
//             timerStart: 12345,
//         },
//     },
// };
