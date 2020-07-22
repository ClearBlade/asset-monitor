import { Tree } from '../tree';

let tree;
let node1, node2, node3, node4, node5;
describe('Tree Test', () => {
    beforeEach(function() {
        node1 = {
            id: '1',
            children: new Set(),
            meta: {},
            parentID: '',
        };
        node2 = {
            id: '2',
            children: new Set(),
            meta: {},
            parentID: '',
        };
        node3 = {
            id: '3',
            children: new Set(),
            meta: {},
            parentID: '',
        };
        node4 = {
            id: '4',
            children: new Set(),
            meta: {},
            parentID: '',
        };
        node5 = {
            id: '5',
            children: new Set(),
            meta: {},
            parentID: '',
        };

        tree = new Tree(node1, '');
    });
    it('Add Child', () => {
        tree.addChild(node2, node1.id);
        expect(tree.nodes.get(node2.id)).toEqual({
            ...node2,
            parentID: node1.id,
        });
        expect(tree.nodes.get(node2.id).parentID).toEqual(node1.id);
    });

    it('Should return all subtree Ids including itself', () => {
        tree.addChild(node2, node1.id);
        tree.addChild(node3, node2.id);
        tree.removeChild(node2.id);
        expect(tree.nodes.get(node2.id)).toBeUndefined();
        expect(tree.nodes.get(node3.id)).toBeUndefined();
        expect(tree.nodes.get(node1.id).children.size).toEqual(0);
    });

    it('Add Child Part 2', () => {
        tree.addChild(node2, node1.id);
        expect(tree.nodes.get(node2.id)).toEqual({ ...node2, parentID: node1.id });
        expect(tree.nodes.get(node2.id).parentID).toEqual(node1.id);
    });

    it('Remove Child tests Part 2', () => {
        tree.addChild(node2, node1.id);
        tree.addChild(node3, node1.id);
        tree.removeChild(node2.id);
        expect(tree.nodes.get(node2.id)).toBeUndefined();
        expect(tree.nodes.get(node3.id)).toEqual({ ...node3, parentID: node1.id });
        expect(tree.nodes.get(node1.id).children.has('3')).toEqual(true);
    });

    it('should throw an error if we Remove Root', () => {
        expect(() => {
            tree.removeChild(node1.id);
        }).toThrow('Root cannot be deleted.');
    });

    it('Add Child Tree', () => {
        const tree2 = new Tree(node4, '');
        tree2.addChild(node5, node4.id);
        tree.addChild(node2, node1.id);
        tree.addChildTree(tree2, node2.id);
        expect(tree.nodes.get(node4.id)).toEqual({ ...node4, parentID: node2.id });
        expect(tree.nodes.get(node5.id).parentID).toEqual(node4.id);
        expect(tree.nodes.get(node5.id)).toEqual({ ...node5, parentID: node4.id });
        const childSet = new Set();
        childSet.add(node4.id);
        expect(tree.nodes.get(node2.id)).toEqual({ ...node2, children: childSet, parentID: node1.id });
    });
});
