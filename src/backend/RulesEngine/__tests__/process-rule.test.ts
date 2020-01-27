import { processRule } from '../utils';

describe('Duration For Rules', () => {
    it('processes a basic rule after run failure with duration', () => {
        const processedRule = processRule(
            [incoming.FAILED_WITH_DURATION],
            {
                conditionIds: [],
                hasDuration: false,
                hasSuccessfulResult: false,
                numValidCombination: 0,
            },
            'all',
        );
        expect({
            ...processedRule,
            conditionIds: new Set(processedRule.conditionIds), // Set allows order of root array not to matter
        }).toEqual({
            ...results.FAILED_WITH_DURATION,
            conditionIds: new Set(results.FAILED_WITH_DURATION.conditionIds),
        });
    });

    it('processes a basic rule after run failure without duration', () => {
        const processedRule = processRule(
            [incoming.FAILED_WITHOUT_DURATION],
            {
                conditionIds: [],
                hasDuration: false,
                hasSuccessfulResult: false,
                numValidCombination: 0,
            },
            'all',
        );
        expect({
            ...processedRule,
            conditionIds: new Set(processedRule.conditionIds), // Set allows order of root array not to matter
        }).toEqual({
            ...results.FAILED_WITHOUT_DURATION,
            conditionIds: new Set(results.FAILED_WITHOUT_DURATION.conditionIds),
        });
    });

    it('processes a split rule after run failure without duration', () => {
        const processedRule = processRule(
            [incoming.SPLIT_FAILED_WITHOUT_DURATION],
            {
                conditionIds: [],
                hasDuration: false,
                hasSuccessfulResult: false,
                numValidCombination: 0,
            },
            'all',
        );
        expect({
            ...processedRule,
            conditionIds: new Set(processedRule.conditionIds), // Set allows order of root array not to matter
        }).toEqual({
            ...results.SPLIT_FAILED_WITHOUT_DURATION,
            conditionIds: new Set(results.SPLIT_FAILED_WITHOUT_DURATION.conditionIds),
        });
    });

    it('processes a split rule after run failure with duration', () => {
        const processedRule = processRule(
            [incoming.SPLIT_FAILED_WITH_DURATION],
            {
                conditionIds: [],
                hasDuration: false,
                hasSuccessfulResult: false,
                numValidCombination: 0,
            },
            'all',
        );
        expect({
            ...processedRule,
            conditionIds: new Set(processedRule.conditionIds), // Set allows order of root array not to matter
        }).toEqual({
            ...results.SPLIT_FAILED_WITH_DURATION,
            conditionIds: new Set(results.SPLIT_FAILED_WITH_DURATION.conditionIds),
        });
    });

    it('processes a nested rule after run failure with duration', () => {
        const processedRule = processRule(
            [incoming.NESTED_FAILED_WITH_DURATION],
            {
                conditionIds: [],
                hasDuration: false,
                hasSuccessfulResult: false,
                numValidCombination: 0,
            },
            'all',
        );
        expect({
            ...processedRule,
            conditionIds: new Set(processedRule.conditionIds), // Set allows order of root array not to matter
        }).toEqual({
            ...results.NESTED_FAILED_WITH_DURATION,
            conditionIds: new Set(results.NESTED_FAILED_WITH_DURATION.conditionIds),
        });
    });

    it('processes a nested rule after run failure without duration', () => {
        const processedRule = processRule(
            [incoming.NESTED_FAILED_WITHOUT_DURATION],
            {
                conditionIds: [],
                hasDuration: false,
                hasSuccessfulResult: false,
                numValidCombination: 0,
            },
            'all',
        );
        expect({
            ...processedRule,
            conditionIds: new Set(processedRule.conditionIds), // Set allows order of root array not to matter
        }).toEqual({
            ...results.NESTED_FAILED_WITHOUT_DURATION,
            conditionIds: new Set(results.NESTED_FAILED_WITHOUT_DURATION.conditionIds),
        });
    });
});

const incoming = {
    FAILED_WITHOUT_DURATION: {
        all: [
            {
                fact: 'state',
                operator: 'equal',
                params: {
                    id: 'testAsset5',
                    attribute: 'speed',
                    collection: 'assets',
                    type: 'yacht',
                    duration: null,
                },
                factResult: 75,
                result: true,
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
                    duration: null,
                },
                factResult: 80,
                result: false,
                path: '.data.custom_data.speed',
                value: 70,
            },
        ],
    },
    FAILED_WITH_DURATION: {
        all: [
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
                result: true,
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
    SPLIT_FAILED_WITH_DURATION: {
        all: [
            {
                all: [
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
                        result: true,
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
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
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
                            id: 'testAsset2',
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
        ],
    },
    SPLIT_FAILED_WITHOUT_DURATION: {
        all: [
            {
                all: [
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset5',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'yacht',
                            duration: null,
                        },
                        factResult: 75,
                        result: true,
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
                            duration: null,
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
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset1',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'yacht',
                            duration: null,
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
                            id: 'testAsset2',
                            attribute: 'speed',
                            collection: 'assets',
                            type: 'yacht',
                            duration: null,
                        },
                        factResult: 80,
                        result: false,
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                ],
            },
        ],
    },
    NESTED_FAILED_WITH_DURATION: {
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
    NESTED_FAILED_WITHOUT_DURATION: {
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
                            duration: null,
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
                            duration: null,
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
                                    duration: null,
                                },
                                factResult: 50,
                                result: false,
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
                                    duration: null,
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
                                    duration: null,
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
                                    duration: null,
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
    FAILED_WITHOUT_DURATION: {
        conditionIds: [['testAsset5']],
        hasDuration: false,
        hasSuccessfulResult: true,
        numValidCombination: 1,
    },
    FAILED_WITH_DURATION: {
        conditionIds: [['testAsset5', 'testAsset6']],
        hasDuration: true,
        hasSuccessfulResult: true,
        numValidCombination: 2,
    },
    SPLIT_FAILED_WITH_DURATION: {
        conditionIds: [
            ['testAsset1', 'testAsset5', 'testAsset6'],
            ['testAsset2', 'testAsset5', 'testAsset6'],
        ],
        hasDuration: true,
        hasSuccessfulResult: true,
        numValidCombination: 3,
    },
    SPLIT_FAILED_WITHOUT_DURATION: {
        conditionIds: [['testAsset5']],
        hasDuration: false,
        hasSuccessfulResult: true,
        numValidCombination: 1,
    },
    NESTED_FAILED_WITH_DURATION: {
        conditionIds: [
            ['testAsset1', 'testAsset3', 'testAsset5'],
            ['testAsset1', 'testAsset3', 'testAsset6'],
            ['testAsset1', 'testAsset4', 'testAsset5'],
            ['testAsset1', 'testAsset4', 'testAsset6'],
        ],
        hasDuration: true,
        hasSuccessfulResult: true,
        numValidCombination: 3,
    },
    NESTED_FAILED_WITHOUT_DURATION: {
        conditionIds: [],
        hasDuration: false,
        hasSuccessfulResult: false,
        numValidCombination: 0,
    },
};
