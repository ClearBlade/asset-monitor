import { processRule } from '../utils';

describe('Duration For Rules', () => {
    it('processes a basic rule after run failure with duration', () => {
        const processedRule = processRule([incoming.FAILED_WITH_DURATION]);
        expect(processedRule).toEqual(results.FAILED_WITH_DURATION);
    });

    it('processes a basic rule after run failure without duration', () => {
        const processedRule = processRule([incoming.FAILED_WITHOUT_DURATION]);
        expect(processedRule).toEqual(results.FAILED_WITHOUT_DURATION);
    });

    it('processes a mixed level type rule ALL', () => {
        const processedRule = processRule([incoming.MIXED_LEVEL_TYPES_ALL]);
        expect(processedRule).toEqual(results.MIXED_LEVEL_TYPES_ALL);
    });

    it('processes a mixed level type rule ANY', () => {
        const processedRule = processRule([incoming.MIXED_LEVEL_TYPES_ANY]);
        expect(processedRule).toEqual(results.MIXED_LEVEL_TYPES_ANY);
    });

    it('processes a split rule after run failure without duration', () => {
        const processedRule = processRule([incoming.SPLIT_FAILED_WITHOUT_DURATION]);
        expect(processedRule).toEqual(results.SPLIT_FAILED_WITHOUT_DURATION);
    });

    it('processes a split rule after run failure with duration', () => {
        const processedRule = processRule([incoming.SPLIT_FAILED_WITH_DURATION]);
        expect(processedRule).toEqual(results.SPLIT_FAILED_WITH_DURATION);
    });

    it('processes a nested rule after run failure with duration', () => {
        const processedRule = processRule([incoming.NESTED_FAILED_WITH_DURATION]);
        expect(processedRule).toEqual(results.NESTED_FAILED_WITH_DURATION);
    });

    it('processes a nested rule after run failure without duration', () => {
        const processedRule = processRule([incoming.NESTED_FAILED_WITHOUT_DURATION]);
        expect(processedRule).toEqual(results.NESTED_FAILED_WITHOUT_DURATION);
    });
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
    MIXED_LEVEL_TYPES_ALL: {
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
                result: false,
                path: '.data.custom_data.speed',
                value: 70,
            },
            {
                any: [
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
                        factResult: 75,
                        result: false,
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset7',
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
    MIXED_LEVEL_TYPES_ANY: {
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
                all: [
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
                        factResult: 75,
                        result: false,
                        path: '.data.custom_data.speed',
                        value: 70,
                    },
                    {
                        fact: 'state',
                        operator: 'equal',
                        params: {
                            id: 'testAsset7',
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
                                factResult: 52,
                                result: false,
                                path: '.data.custom_data.speed',
                                value: 50,
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
                associatedId: false,
                result: true,
                duration: null,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
        ],
    ],
    FAILED_WITH_DURATION: [
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: true,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
        ],
    ],
    MIXED_LEVEL_TYPES_ALL: [
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset7',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
        ],
    ],
    MIXED_LEVEL_TYPES_ANY: [
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset7',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
        ],
    ],
    SPLIT_FAILED_WITH_DURATION: [
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: true,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset1',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset2',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
        ],
    ],
    SPLIT_FAILED_WITHOUT_DURATION: [
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: true,
                duration: null,
                timerStart: 0,
            },
            {
                id: 'testAsset1',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
            {
                id: 'testAsset1',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: true,
                duration: null,
                timerStart: 0,
            },
            {
                id: 'testAsset2',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
            {
                id: 'testAsset2',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
        ],
    ],
    NESTED_FAILED_WITH_DURATION: [
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset1',
                associatedId: false,
                result: true,
                duration: 10000,
                timerStart: 0,
            },
            {
                id: 'testAsset2',
                associatedId: false,
                result: false,
                duration: 10000,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset1',
                associatedId: false,
                result: true,
                duration: 10000,
                timerStart: 0,
            },
            {
                id: 'testAsset2',
                associatedId: false,
                result: false,
                duration: 10000,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset3',
                associatedId: false,
                result: false,
                duration: 20000,
                timerStart: 0,
            },
            {
                id: 'testAsset4',
                associatedId: false,
                result: false,
                duration: 20000,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: 30000,
                timerStart: 0,
            },
            {
                id: 'testAsset3',
                associatedId: false,
                result: false,
                duration: 20000,
                timerStart: 0,
            },
            {
                id: 'testAsset4',
                associatedId: false,
                result: false,
                duration: 20000,
                timerStart: 0,
            },
        ],
    ],
    NESTED_FAILED_WITHOUT_DURATION: [
        [
            {
                id: 'testAsset5',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
            {
                id: 'testAsset6',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset3',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
            {
                id: 'testAsset1',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
        ],
        [
            {
                id: 'testAsset3',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
            {
                id: 'testAsset2',
                associatedId: false,
                result: false,
                duration: null,
                timerStart: 0,
            },
        ],
    ],
};
