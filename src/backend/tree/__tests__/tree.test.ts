import { Tree } from '../tree';

let tree;
let node1, node2, node3;
describe('Tree Test', () => {
    beforeEach(function() {
        node1 = {
            id: '1',
            children: [],
            meta: {},
            parentID: '',
        };
        node2 = {
            id: '2',
            children: [],
            meta: {},
            parentID: '',
        };
        node3 = {
            id: '3',
            children: [],
            meta: {},
            parentID: '',
        };
        tree = new Tree(node1);
    });
    it('Add Child', () => {
        tree.addChild(node2, node1.id);
        expect(Object.values(tree.nodes)).toContainEqual({
            ...node2,
            parentID: node1.id,
        });
        expect(tree.nodes[node2.id].parentID).toEqual(node1.id);
    });

    it('Should return all subtree Ids including itself', () => {
        tree.addChild(node2, node1.id);
        tree.addChild(node3, node2.id);
        tree.removeChild(node2.id);
        expect(tree.nodes[node2.id]).toBeUndefined();
        expect(tree.nodes[node3.id]).toBeUndefined();
        expect(tree.nodes[node1.id].children).toEqual([]);
        //expect(node2.children).toEqual([]);
        // console.log('Remove Child tests Part 1::::::: ', node2, node3);
    });

    it('Add Child Part 2', () => {
        tree.addChild(node2, node1.id);
        expect(Object.values(tree.nodes)).toContainEqual({ ...node2, parentID: node1.id });
        expect(tree.nodes[node2.id].parentID).toEqual(node1.id);
    });

    it('Remove Child tests Part 2', () => {
        tree.addChild(node2, node1.id);
        tree.addChild(node3, node1.id);
        tree.removeChild(node2.id);
        expect(tree.nodes[node2.id]).toBeUndefined();
        expect(tree.nodes[node3.id]).toEqual({ ...node3, parentID: node1.id });
        expect(tree.nodes[node1.id].children).toEqual(['3']);
    });

    it('should throw an error if we Remove Root', () => {
        expect(() => {
            tree.removeChild(node1.id);
        }).toThrow('Root cannot be deleted.');
    });
});
