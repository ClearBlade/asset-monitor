import { Tree } from "../tree"

const node1 = {
    "id":"1",
    "children":[],
    "meta":{},
    "parentID":""
}
const node2 = {
    id: '2',
    children: [],
    meta: {},
    parentID: '',
};
const node3 = {
    id: '3',
    children: [],
    meta: {},
    parentID: '',
};
let tree =  new Tree(node1);

describe('Tree Test', () => {
    it('Add Child', ()=>{
        tree.addChild(node2, node1.id);
        expect(Object.values(tree.nodes)).toContainEqual({
            ...node2,
            parentID:node1.id,
        });
        expect(tree.nodes[node2.id].parentID).toEqual(node1.id);
    });

    it('Should return all subtree Ids including itself', () => {
        tree.addChild(node3, node2.id);
        tree.getSubtreeIDs(node1.id);
        expect(tree.getSubtreeIDs(node1.id).sort()).toEqual(["1", "2", "3"].sort());
    });

    it('Remove Child tests Part 1', ()=> {
        tree.removeChild(node2.id);
        expect(tree.nodes[node2.id]).toBeUndefined();
        expect(tree.nodes[node3.id]).toBeUndefined();
        expect(tree.nodes[node1.id].children).toEqual([]);
    });

    it('Add Child Part 2', () => {
        console.log(node2, node3); // How come consts get updated?? object 
        tree.addChild(node2, node1.id);
        tree.addChild(node3,node1.id);
        expect(Object.values(tree.nodes)).toContainEqual(node2);
        expect(tree.nodes[node2.id].parentID).toEqual(node1.id);
    });

    it('Remove Child tests Part 2', () => {
        tree.removeChild(node2.id);
        expect(tree.nodes[node2.id]).toBeUndefined();
        expect(tree.nodes[node3.id]).toEqual(node3);
        expect(tree.nodes[node1.id].children).toEqual(["3"]);
    });

    it('should throw an error if we Remove Root', () => {
        expect(()=> {
            tree.removeChild(node1.id)
        }).toThrow('Root cannot be deleted.');   
    });
    
});

