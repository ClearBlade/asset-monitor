import '../tree_helper.ts';
import '../../collection-lib';
import { CbCollectionLib } from '../../collection-lib';
import { CollectionName } from '../../global-config';
import { addChild, removeNode, getTree } from '../tree_helper';
import { TreeNode, Tree } from '../tree';

const value1 = {
    id: '11',
    tree: {
        rootID: '1',
        nodes: {
            '1': {
                id: '1',
                parentID: '',
                meta: {},
                children: new Set(),
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
    children: new Set(),
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
                children: Set['2'],
            },
            '2': {
                id: '2',
                parentID: '1',
                meta: {},
                children: new Set(),
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
                children: new Set(),
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
    it('1. add child', () => {
        // const col = CbCollectionLib(CollectionName.ASSET_TREE);
        // col.cbCreatePromise({
        //     item: value1,
        // });
        const p = addChild('1', node2);
        p.then(function(tree: Tree<TreeNode>) {
            expect(tree.getTree()).toEqual(updatedTree.tree);
        });
    });

    it('2. get Tree', () => {
        fetchFn = (): Record<string, unknown> => updatedCbValue;
        const p = getTree('11');
        p.then(function(tree) {
            expect(tree).toEqual(updatedTree.tree);
        });
    });

    it('3. remove node', () => {
        fetchFn = (): Record<string, unknown> => updatedCbValue;
        const p = removeNode('11', '2');
        p.then(function(tree) {
            expect(tree.getTree()).toEqual(removedTree.tree);
        });
    });

    it('4. remove node from an non-existant tree', () => {
        fetchFn = (): Record<string, unknown> => updatedCbValue;
        const p = removeNode('1', '2');
        p.catch(function(rej) {
            expect(rej).toEqual(new Error('Node doesnt exist'));
        });
    });
});
