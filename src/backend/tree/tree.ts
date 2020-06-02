export interface ITreeNode {
    id: String;
    children: Array<ITreeNode['id']>;
    meta: Object;
    parentID: String; // Assuming there is just one parent
}

export interface NodeDict<T extends ITreeNode> {
    [key: string]: T;
}

export interface ITree<T extends ITreeNode> {
    root: String;
    nodes: NodeDict<T>;
}

export class Tree<T extends ITreeNode> {
    generateTreeId(): String {
        return '';
    }
    rootID: String;
    nodes: NodeDict<T>;
    id: String; // A treeID will be generated everytime a new tree is created
    constructor(rootNode: T) {
        this.rootID = rootNode['id'];
        this.nodes = {};
        this.nodes[this.rootID as string] = { ...rootNode };
        this.id = this.generateTreeId();
    }

    createNewSubtree(rootID: ITreeNode['id'], treeNodes: NodeDict<T>): Tree<T> {
        let tree = new Tree(treeNodes[rootID as string]);
        tree.nodes = treeNodes;
        return tree;
    }

    findNodeByID(nodeID: String): T {
        //returns T from the nodes object
        throw new Error('Method not implemented.');
    }

    addChild(node: T, parentID: T['id']): Tree<T> {
        //adds child to the parent node's list
        //adds child T to the NodeDict
        //returns tree as promise
        console.log('Add Child:', node);
        if (node.children.length > 0) {
            throw new Error('A new born cannot have children, Duh..');
        }

        let parentNode = this.nodes[parentID as string];
        let childID = node['id'];
        let child = { ...node, parentID };
        this.nodes[childID as string] = child;
        parentNode.children.push(childID);
        return this;
    }

    getAllNodes(): NodeDict<T> {
        //returns the nodes' object/dict
        //throw new Error('Method not implemented.');
        return this.nodes;
    }

    removeChild(nodeID: String): Tree<T> {
        //creates a new Tree
        //removes the child & it's children recursively
        //add them to the new Tree

        //deleting the root is not allowed in this function
        if (nodeID === this.rootID) {
            throw new Error('Root cannot be deleted.');
        }

        let subTreeDict: NodeDict<T> = {};
        let currentNode = this.nodes[nodeID as string];

        if (!currentNode) {
            throw new Error('Node doesnt exist');
        }

        let parentID = currentNode['parentID'];
        let childIndex = this.nodes[parentID as string].children.indexOf(currentNode['id']);
        this.nodes[parentID as string].children.splice(childIndex, 1);

        let subTreeIDs = this.getSubtreeIDs(currentNode['id']);
        subTreeIDs.forEach(id => {
            subTreeDict[id as string] = { ...this.nodes[id as string] };
            delete this.nodes[id as string];
        });
        let tree = this.createNewSubtree(currentNode['id'], subTreeDict);
        //console.log("Current tree: ", this);
        //console.log("Deleted Tree", tree);

        return tree;
        // throw new Error('Method not implemented.');
        // returns the subTree..
    }

    getSubtreeIDs(nodeID: String): Array<ITreeNode['id']> {
        let currNode = this.nodes[nodeID as string];
        let IDs: Array<ITreeNode['id']> = [];
        IDs.push(currNode['id']);

        currNode.children.forEach(child => {
            let subTreeIDs = this.getSubtreeIDs(child);
            IDs = IDs.concat(subTreeIDs);
        });
        return IDs;
    }

    getSubtreeByID(nodeID: String): Tree<T> {
        //creates a new Tree,
        //clones the subtree from the tree
        // returns the subTree..
        let subTreeDict: NodeDict<T> = {};
        let currentNode = this.nodes[nodeID as string];
        let subTreeIDs = this.getSubtreeIDs(currentNode['id']);
        subTreeIDs.forEach(id => {
            subTreeDict['id'] = this.nodes[id as string];
        });
        let tree = new Tree(subTreeDict[currentNode['id'] as string]);

        return tree;
    }
}
