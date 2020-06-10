export interface TreeNode {
    id: string;
    children: Array<TreeNode['id']>;
    meta: Record<string, unknown>;
    parentID: string; // Assuming there is just one parent
}

export interface NodeDict<T extends TreeNode> {
    [key: string]: T;
}

export interface Trees<T extends TreeNode> {
    rootID: string;
    nodes: NodeDict<T>;
}

export class Tree<T extends TreeNode> implements Trees<T> {
    generateTreeId(): string {
        return '';
    }
    id: string; // A treeID will be generated everytime a new tree is created
    constructor(rootNode: T) {
        this.rootID = rootNode['id'];
        this.nodes = {};
        this.nodes[this.rootID as string] = { ...rootNode };
        this.id = this.generateTreeId();
    }
    rootID: string;
    nodes: NodeDict<T>;

    createNewTree(rootID: TreeNode['id'], treeNodes: NodeDict<T>): Tree<T> {
        const tree = new Tree(treeNodes[rootID as string]);
        tree.nodes = treeNodes;
        return tree;
    }

    findNodeByID(nodeID: string): T {
        //returns T from the nodes object
        throw new Error('Method not implemented.' + nodeID);
    }

    addChild(node: T, parentID: T['id']): Tree<T> {
        //adds child to the parent node's list
        //adds child T to the NodeDict
        //returns tree as promise
        if (node.children.length > 0) {
            throw new Error('A new born cannot have children, Duh..');
        }

        const parentNode = this.nodes[parentID as string];
        const childID = node['id'];
        const child = { ...node, parentID };
        this.nodes[childID as string] = child;
        parentNode.children.push(childID);
        return this;
    }

    getAllNodes(): NodeDict<T> {
        //returns the nodes' object/dict
        //throw new Error('Method not implemented.');
        return this.nodes;
    }

    removeChild(nodeID: string): Tree<T> {
        //creates a new Tree
        //removes the child & it's children recursively
        //add them to the new Tree

        //deleting the root is not allowed in this function
        if (nodeID === this.rootID) {
            throw new Error('Root cannot be deleted.');
        }

        const subTreeDict: NodeDict<T> = {};
        const currentNode = this.nodes[nodeID as string];

        if (!currentNode) {
            throw new Error('Node doesnt exist');
        }

        const parentID = currentNode['parentID'];
        const childIndex = this.nodes[parentID as string].children.indexOf(currentNode['id']);
        this.nodes[parentID as string].children.splice(childIndex, 1);

        const subTreeIDs = this.getSubtreeIDs(currentNode['id']);
        subTreeIDs.forEach(id => {
            subTreeDict[id as string] = { ...this.nodes[id as string] };
            delete this.nodes[id as string];
        });
        const tree = this.createNewTree(currentNode['id'], subTreeDict);

        return tree;
        // throw new Error('Method not implemented.');
        // returns the subTree..
    }

    getSubtreeIDs(nodeID: string): Array<TreeNode['id']> {
        const currNode = this.nodes[nodeID as string];
        let IDs: Array<TreeNode['id']> = [];
        IDs.push(currNode['id']);

        currNode.children.forEach(child => {
            const subTreeIDs = this.getSubtreeIDs(child);
            IDs = IDs.concat(subTreeIDs);
        });
        return IDs;
    }

    getSubtreeByID(nodeID: string): Tree<T> {
        //creates a new Tree,
        //clones the subtree from the tree
        // returns the subTree..
        const subTreeDict: NodeDict<T> = {};
        const currentNode = this.nodes[nodeID as string];
        const subTreeIDs = this.getSubtreeIDs(currentNode['id']);
        subTreeIDs.forEach(id => {
            subTreeDict['id'] = this.nodes[id as string];
        });
        const tree = new Tree(subTreeDict[currentNode['id'] as string]);

        return tree;
    }

    getTree(): Trees<T> {
        return {
            rootID: this.rootID,
            nodes: this.nodes,
        };
    }
}

export function CreateNewTree(tree: Trees<TreeNode>): Tree<TreeNode> {
    const newTree = new Tree(tree.nodes[tree.rootID as string]);
    newTree.nodes = tree.nodes;
    return newTree;
}
