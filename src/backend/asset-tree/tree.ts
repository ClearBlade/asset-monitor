import uuid = require('uuid');

export interface OrphanTreeNode {
    id: string;
    meta: Record<string, unknown>;
}
export interface TreeNode extends OrphanTreeNode {
    children: Set<TreeNode['id']>;

    parentID: string; // Assuming there is just one parent
}

export interface Trees<T extends TreeNode> {
    rootID: string;
    nodes: Map<string, T>;
    treeID: string;
}

// Need to add check for cycles
// Need to throw error if adding fails

export class Tree<T extends TreeNode> implements Trees<T> {
    treeID: string; // A treeID will be generated everytime a new tree is created
    rootID: string;
    nodes: Map<string, T>;
    constructor(rootNode: T, id: string) {
        this.rootID = rootNode['id'];
        this.nodes = new Map<string, T>();
        if (!rootNode.children) {
            rootNode.children = new Set<string>();
        }
        this.nodes.set(this.rootID as string, { ...rootNode });
        this.treeID = id || uuid();
    }

    createNewTree(rootID: TreeNode['id'], treeNodes: Map<string, T>): Tree<T> {
        const rootNode = treeNodes.get(rootID as string);
        if (!rootNode) {
            throw new Error('The rootNode object is missing, please provide object for id: ' + rootID);
        }
        const tree = new Tree(rootNode, '');
        tree.nodes = treeNodes;
        return tree;
    }

    getNodeByID(nodeID: string): T {
        //returns T from the nodes object
        const currNode = this.nodes.get(nodeID);
        if (!currNode) {
            throw new Error('The node with id' + nodeID + ' is missing');
        }
        return currNode;
    }

    addChildTree(childTree: Tree<T>, parentID: T['id']): Tree<T> {
        const childID = childTree.rootID;
        const parentNode = this.nodes.get(parentID as string);
        const childNode = childTree.nodes.get(childID as string);
        if (this.nodes.has(childID as string)) {
            throw new Error('A child already exists with the ID ' + childID);
        }
        if (!parentNode) {
            throw new Error('The parent object is missing, please provide object for id: ' + parentID);
        }
        if (!childNode) {
            throw new Error('The child object is missing, please provide object for id: ' + childID);
        }
        childNode.parentID = parentID;

        if (!parentNode.children) {
            parentNode.children = new Set();
        }
        parentNode.children.add(childID);
        childTree.getAllNodes().forEach(n => {
            this.nodes.set(n.id, n);
        });
        return this;
    }

    addChild(orphanNode: OrphanTreeNode, parentID: T['id']): Tree<T> {
        const node = ConvertToTreeNode(orphanNode);
        const parentNode = this.nodes.get(parentID as string);

        if (!parentNode) {
            throw new Error('The parent object is missing, please provide object for id: ' + parentID);
        }
        if (!node.children) {
            throw new Error('children key is missing in the node..');
        }
        if (node.children.size > 0) {
            throw new Error('A new born cannot have children, Duh..');
        }

        const childID = node['id'];
        const child = { ...node, parentID };
        if (this.nodes.has(childID as string)) {
            throw new Error('A child already exists with the ID ' + childID);
        }
        this.nodes.set(childID as string, child as T);
        if (!parentNode.children) {
            parentNode.children = new Set<string>();
        }
        parentNode.children.add(childID);
        return this;
    }

    getAllNodes(): Map<string, T> {
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

        const subTreeDict: Map<string, T> = new Map();
        const currentNode = this.nodes.get(nodeID);

        if (!currentNode) {
            throw new Error("The node intended to delete doesn't exist: " + nodeID);
        }

        const parentID = currentNode['parentID'];
        currentNode['parentID'] = ''; // reset parent...
        const parentNode = this.nodes.get(parentID);
        if (!parentNode) {
            throw new Error('The parent node: ' + parentID + 'of the node being deleted: ' + nodeID + ' is missing');
        }
        parentNode.children.delete(currentNode['id']);
        this.nodes.set(parentID, parentNode);
        const subTreeIDs = this.getSubtreeIDs(nodeID);

        subTreeIDs.forEach(id => {
            const curr = this.nodes.get(id);
            if (!curr) {
                throw new Error('Subtree Node: ' + id + ' of node to be deleted: ' + nodeID + ' doesnt exist');
            }
            subTreeDict.set(id, { ...curr });
            this.nodes.delete(id);
        });
        const tree = this.createNewTree(currentNode['id'], subTreeDict);

        return tree;
        // throw new Error('Method not implemented.');
        // returns the subTree..
    }

    getSubtreeIDs(nodeID: string): Array<TreeNode['id']> {
        const currNode = this.nodes.get(nodeID);
        if (!currNode) {
            throw new Error('The node: ' + nodeID + " whose subTree are being extracted doesn't exist: ");
        }

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
        // returns the subTree with the given nodeID as the root..
        const subTreeMap: Map<string, T> = new Map();
        const currentNode = this.nodes.get(nodeID);

        if (!currentNode) {
            throw new Error('The node: ' + nodeID + " whose subTree by ID is being extracted doesn't exist: ");
        }
        const subTreeIDs = this.getSubtreeIDs(currentNode['id']);
        subTreeIDs.forEach(id => {
            const subtTreeNode = this.nodes.get(id);
            if (!subtTreeNode) {
                throw new Error('The node: ' + id + " whose subTreeNodes are being extracted doesn't exist: ");
            }
            subTreeMap.set(id, subtTreeNode);
        });

        const tree = new Tree(currentNode, '');

        return tree;
    }

    getTree(): Trees<T> {
        return {
            rootID: this.rootID,
            nodes: this.nodes,
            treeID: this.treeID,
        };
    }

    size(): number {
        return Object.keys(this.nodes).length;
    }
}

export function CreateTree(tree: Trees<TreeNode>): Tree<TreeNode> {
    const currRoot = tree.nodes.get(tree.rootID);
    if (!currRoot) {
        log('CreateTree:: rootID is missing');
        throw new Error("The rootnode of the tree doesn't exist: " + tree.rootID);
    }
    if (!tree.treeID) {
        log('CreateTree:: treeID is missing, new tree will be created with a new treeID');
    }
    const newTree = new Tree(currRoot, tree.treeID);
    newTree.nodes = tree.nodes;
    return newTree;
}

export function ConvertToTreeNode(orphanNode: OrphanTreeNode): TreeNode {
    return {
        ...orphanNode,
        children: new Set(),
        parentID: '',
    };
}
