import '../tree_helper.ts';
import '../../collection-lib';
import { addChild, removeChild, getTree } from '../tree_helper';
import { AssetTreeNode, AssetTree } from '../tree';

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

// jest.mock('../tree_helper.ts', () => require('../__mocks__/async'));
describe('Asset Tree Handling', () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('get tree', () => {
        it('get tree returns tree object', () => {
            fetchFn = (): Record<string, unknown> => updatedCbValue;
            const p = getTree('11');
            p.then(function(tree) {
                expect(tree).toEqual(updatedTree.tree);
            }).catch(err => console.log(err));
        });
    });

    describe('add child', () => {
        it('add child to existing tree', () => {
            const p = addChild('1', node2);
            p.then(tree => {
                expect(tree).toEqual(updatedTree.tree);
            }).catch(err => undefined);
        });

        it('add child to non-existent tree creates tree from parent and then adds child', () => {
            // TODO
        });
    });

    describe('remove child', () => {
        it('remove child from tree', () => {
            fetchFn = (): Record<string, unknown> => updatedCbValue;
            const p = removeChild('11', '2');
            p.then(function(tree) {
                expect(tree).toEqual(removedTree.tree);
            }).catch(err => console.log(err));
        });

        it('remove child from non-existent tree rejects', () => {
            fetchFn = (): Record<string, unknown> => updatedCbValue;
            const p = removeChild('1', '2');
            p.catch(function(rej) {
                expect(rej).toEqual(new Error('Node doesnt exist'));
            });
        });
    });
});

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

const node2: AssetTreeNode = {
    id: '2',
    parentID: '',
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
                children: Set['2'],
            },
            '2': {
                id: '2',
                parentID: '1',
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
                children: new Set(),
            },
        },
    },
};

const updatedCbValue = {
    DATA: [updatedTree],
};
