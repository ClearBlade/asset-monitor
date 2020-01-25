import { processRule } from '../utils';

describe('Duration For Rules', () => {
    it('processes a rule after run failure with duration', () => {
        const processedRule = processRule(
            [incoming.FAILED_WITH_DURATION],
            {
                conditionIds: [],
                hasDuration: false,
                hasSuccessfulResult: false,
            },
            [],
        );
        expect({
            ...processedRule,
            conditionIds: new Set(processedRule.conditionIds), // Set allows order of root array not to matter
        }).toEqual({
            ...results.FAILED_WITH_DURATION,
            conditionIds: new Set(results.FAILED_WITH_DURATION.conditionIds),
        });
    });
});

const incoming = {
    FAILED_WITH_DURATION: {
        all: [
            {
                any: [
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset5',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'yacht',
                            duration: 30000,
                        },
                        factResult: 75,
                        result: false,
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset6',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'yacht',
                            duration: 30000,
                        },
                        factResult: 80,
                        result: false,
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                ],
            },
            {
                any: [
                    {
                        any: [
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset1',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 10000,
                                },
                                factResult: 50,
                                result: true,
                                path: '.data.custom_data.speed',
                                value: 50,
                            },
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset2',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'train',
                                    duration: 10000,
                                },
                                result: false,
                                path: '.data.custom_data.speed',
                                value: 50,
                            },
                        ],
                    },
                    {
                        any: [
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset3',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'gondola',
                                    duration: 20000,
                                },
                                factResult: 65,
                                result: false,
                                path: '.data.custom_data.speed',
                                value: 60,
                            },
                            {
                                fact: 'state',
                                operator: 'equal',
                                params: {
                                    id: 'testAsset4',
                                    attribute: 'speed',
                                    collection: 'assets',
                                    type: 'gondola',
                                    duration: 20000,
                                },
                                factResult: 70,
                                result: false,
                                path: '.data.custom_data.speed',
                                value: 60,
                            },
                        ],
                    },
                ],
            },
        ],
    },
};

const results = {
    FAILED_WITH_DURATION: {
        conditionIds: [
            ['testAsset1', 'testAsset3', 'testAsset5'],
            ['testAsset1', 'testAsset3', 'testAsset6'],
            ['testAsset1', 'testAsset4', 'testAsset5'],
            ['testAsset1', 'testAsset4', 'testAsset6'],
        ],
        hasDuration: true,
        hasSuccessfulResult: true,
    },
};
