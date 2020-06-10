import '../index.ts';
import '../../collection-lib';
import { CbCollectionLib } from '../../collection-lib';
import { CollectionName } from '../../global-config';
import { addNode, removeNode } from '..';
import { TreeNode } from '../tree';

const value1 = {
    id: '11',
    tree: {
        rootID: '1',
        nodes: {
            '1': {
                id: '1',
                parentID: '',
                meta: {},
                children: [],
            },
        },
    },
};

const cbValue = {
    DATA: [value1],
};

const node2: TreeNode = {
    id: '2',
    parentID: '',
    meta: {},
    children: [],
};

const updatedTree = {
    id: '11',
    tree: {
        rootID: '1',
        nodes: {
            '1': {
                id: '1',
                parentID: '',
                meta: {},
                children: ['2'],
            },
            '2': {
                id: '2',
                parentID: '1',
                meta: {},
                children: [],
            },
        },
    },
};

const removedTree = {
    id: '1',
    tree: {
        rootID: '2',
        nodes: {
            '2': {
                id: '2',
                parentID: '1',
                meta: {},
                children: [],
            },
        },
    },
};

const updatedCbValue = {
    DATA: [updatedTree],
};

let fetchFn = (): Record<string, unknown> => cbValue;

jest.mock('../../collection-lib', () => {
    return {
        CbCollectionLib: jest.fn().mockImplementation(() => {
            return {
                cbCreatePromise: jest.fn(() => {
                    return Promise.resolve('success');
                }),
                cbUpdatePromise: jest.fn(() => {
                    return Promise.resolve('success');
                }),
                cbFetchPromise: jest.fn(() => {
                    return Promise.resolve(fetchFn());
                }),
            };
        }),
    };
});

beforeAll(() => {
    // jest.spyOn(CbCollectionLib., 'startTimerAndGetId').mockImplementation(
    //     (): Promise<string> => {
    //         return new Promise(res => res(timerId));
    //     },
    // );
    // jest.spyOn(global.Date, 'now').mockReturnValue(mockTime);
    //jest.spyOn(CbCollectionLib, cbCreatePromise);
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('test suite', () => {
    it('1. add node', () => {
        // const col = CbCollectionLib(CollectionName.ASSET_TREE);
        // col.cbCreatePromise({
        //     item: value1,
        // });
        const p = addNode('11', node2, '1');
        p.then(function(tree) {
            expect(tree.getTree()).toEqual(updatedTree.tree);
        });
    });

    it('2. remove node', () => {
        // const col = CbCollectionLib(CollectionName.ASSET_TREE);
        // col.cbCreatePromise({
        //     item: value1,
        // });
        fetchFn = (): Record<string, unknown> => updatedCbValue;
        const p = removeNode('11', '2');
        //CbCollectionLib(CollectionName.ASSET_TREE).cbFetchPromise
        p.then(function(tree) {
            expect(tree.getTree()).toEqual(removedTree.tree);
        });
        //expect(p).resolves.toEqual(value1);
    });
});
