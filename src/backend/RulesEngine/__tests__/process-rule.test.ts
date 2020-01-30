import { processCondition } from '../utils';

describe('Duration For Rules', () => {
    it('processes a basic rule after run failure with duration', () => {
        const processedRule = processCondition([incoming.FAILED_WITH_DURATION], [], 'all');
        expect(processedRule).toEqual(results.FAILED_WITH_DURATION);
    });

    it('processes a basic rule after run failure without duration', () => {
        const processedRule = processCondition([incoming.FAILED_WITHOUT_DURATION], [], 'all');
        expect(processedRule).toEqual(results.FAILED_WITHOUT_DURATION);
    });

    it('processes a split rule after run failure without duration', () => {
        const processedRule = processCondition([incoming.SPLIT_FAILED_WITHOUT_DURATION], [], 'all');
        expect(processedRule).toEqual(results.SPLIT_FAILED_WITHOUT_DURATION);
    });

    it('processes a split rule after run failure with duration', () => {
        const processedRule = processCondition([incoming.SPLIT_FAILED_WITH_DURATION], [], 'all');
        expect(processedRule).toEqual(results.SPLIT_FAILED_WITH_DURATION);
    });

    // it('processes a nested rule after run failure with duration', () => {
    //     const processedRule = processCondition([incoming.NESTED_FAILED_WITH_DURATION], [], 'all');
    //     expect(processedRule).toEqual(results.NESTED_FAILED_WITH_DURATION);
    // });

    // it('processes a nested rule after run failure without duration', () => {
    //     const processedRule = processRule([incoming.NESTED_FAILED_WITHOUT_DURATION], [], 'all');
    //     expect(processedRule).toEqual(results.NESTED_FAILED_WITHOUT_DURATION);
    // });
});

const incoming = {
    FAILED_WITHOUT_DURATION: {
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
        any: [
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
                all: [
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
                        all: [
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
                                factResult: 60,
                                result: false,
                                path: '.data.custom_data.speed',
                                value: 50,
                            },
                        ],
                    },
                    {
                        all: [
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
        any: [
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
                all: [
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
    FAILED_WITHOUT_DURATION: [
        [
            {
                id: 'testAsset5',
                result: true,
                duration: null,
            },
        ],
        [
            {
                id: 'testAsset6',
                result: false,
                duration: null,
            },
        ],
    ],
    FAILED_WITH_DURATION: [
        [
            {
                id: 'testAsset5',
                result: true,
                duration: 30000,
            },
            {
                id: 'testAsset6',
                result: false,
                duration: 30000,
            },
        ],
    ],
    SPLIT_FAILED_WITH_DURATION: [
        [
            {
                id: 'testAsset5',
                result: true,
                duration: 30000,
            },
            {
                id: 'testAsset6',
                result: false,
                duration: 30000,
            },
        ],
        [
            {
                id: 'testAsset1',
                result: false,
                duration: 30000,
            },
            {
                id: 'testAsset2',
                result: false,
                duration: 30000,
            },
        ],
    ],
    SPLIT_FAILED_WITHOUT_DURATION: [
        [
            {
                id: 'testAsset5',
                result: true,
                duration: null,
            },
            {
                id: 'testAsset1',
                result: false,
                duration: null,
            },
        ],
        [
            {
                id: 'testAsset6',
                result: false,
                duration: null,
            },
            {
                id: 'testAsset1',
                result: false,
                duration: null,
            },
        ],
        [
            {
                id: 'testAsset5',
                result: true,
                duration: null,
            },
            {
                id: 'testAsset2',
                result: false,
                duration: null,
            },
        ],
        [
            {
                id: 'testAsset6',
                result: false,
                duration: null,
            },
            {
                id: 'testAsset2',
                result: false,
                duration: null,
            },
        ],
    ],
    NESTED_FAILED_WITH_DURATION: [
        [
            {
                id: 'testAsset5',
                result: false,
                duration: 10000,
            },
            {
                id: 'testAsset1',
                result: true,
                duration: 10000,
            },
            {
                id: 'testAsset2',
                result: false,
                duration: 10000,
            },
        ],
        [
            {
                id: 'testAsset5',
                result: false,
                duration: 10000,
            },
            {
                id: 'testAsset3',
                result: false,
                duration: 20000,
            },
            {
                id: 'testAsset4',
                result: false,
                duration: 20000,
            },
        ],
        [
            {
                id: 'testAsset6',
                result: false,
                duration: 10000,
            },
            {
                id: 'testAsset1',
                result: true,
                duration: 10000,
            },
            {
                id: 'testAsset2',
                result: false,
                duration: 10000,
            },
        ],
        [
            {
                id: 'testAsset6',
                result: false,
                duration: 10000,
            },
            {
                id: 'testAsset3',
                result: false,
                duration: 20000,
            },
            {
                id: 'testAsset4',
                result: false,
                duration: 20000,
            },
        ],
    ],
    NESTED_FAILED_WITHOUT_DURATION: [
        [
            {
                id: 'testAsset6',
                result: false,
                duration: null,
            },
            {
                id: 'testAsset5',
                result: false,
                duration: null,
            },
        ],
        [
            {
                id: 'testAsset1',
                result: false,
                duration: null,
            },
            {
                id: 'testAsset3',
                result: false,
                duration: null,
            },
        ],
        [
            {
                id: 'testAsset1',
                result: false,
                duration: null,
            },
            {
                id: 'testAsset4',
                result: false,
                duration: null,
            },
        ],
        [
            {
                id: 'testAsset2',
                result: false,
                duration: null,
            },
            {
                id: 'testAsset3',
                result: false,
                duration: null,
            },
        ],
        [
            {
                id: 'testAsset2',
                result: false,
                duration: null,
            },
            {
                id: 'testAsset4',
                result: false,
                duration: null,
            },
        ],
    ],
};
