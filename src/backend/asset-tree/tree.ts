import uuid = require('uuid');
import 'core-js/features/set';

export type AssetID = string;

export interface AssetTreeNode {
    id: AssetID;
    parentID: AssetID;
    children: Set<AssetID>;
}

export interface AssetTreeNodeDict {
    [id: string]: AssetTreeNode;
}

export class AssetTree {
    treeID: string;
    rootID: AssetID;
    nodes: AssetTreeNodeDict;

    constructor(rootNode: AssetTreeNode, treeID?: string, nodes?: AssetTreeNodeDict) {
        this.rootID = rootNode.id;
        this.treeID = treeID || uuid();
        this.nodes = nodes || {};
        this.nodes[this.rootID] = rootNode;
    }

    static createAssetNode(id: AssetID, parentID?: AssetID, children?: Set<AssetID>): AssetTreeNode {
        return {
            id: id,
            parentID: parentID || '',
            children: children || new Set(),
        };
    }

    addChildTree(childTree: AssetTree, parentID: AssetID): void {
        const childRootID = childTree.rootID;
        const childRootNode = childTree.nodes[childRootID];
        const parentNode = this.nodes[parentID];

        if (!parentNode) {
            throw new Error(`Tree ${this.treeID} does not have requested parent ${parentID}, not adding tree.`);
        }

        if (!childRootNode) {
            throw new Error(`Child node ${childRootID} is missing from tree ${childTree.treeID}, not adding tree.`);
        }

        parentNode.children.add(childRootID);
        childRootNode.parentID = parentID;

        // Check if any assets from the tree being added already exist in the tree being added to.
        Object.keys(childTree.nodes).forEach(assetNodeID => {
            if (this.nodes[assetNodeID]) {
                throw new Error(
                    `Asset ${assetNodeID} from tree ${childTree.treeID} already exists in tree ${this.treeID}, not adding tree.`,
                );
            } else {
                this.nodes[assetNodeID] = childTree.nodes[assetNodeID];
            }
        });
    }

    addChildLeaf(childNode: AssetTreeNode, parentID: AssetID): AssetTree {
        const parentNode = this.nodes[parentID];

        if (!parentNode) {
            throw new Error('The parent object is missing, please provide object for id: ' + parentID);
        }

        if (childNode.children.size > 0) {
            throw new Error('A new born cannot have children, Duh..');
        }

        const childID = childNode.id;
        childNode.parentID = parentID;

        if (this.nodes[childID]) {
            throw new Error('A child already exists with the ID ' + childID);
        }

        this.nodes[childID] = childNode;
        parentNode.children.add(childID);
        return this;
    }

    removeChild(childID: AssetID): AssetTree {
        if (childID === this.rootID) {
            throw new Error(`${childID} is equal to the root ID, cannot remove root.`);
        }

        const childNode = this.nodes[childID];
        if (!childNode) {
            throw new Error(`Child root ${childID} does not exist in tree.`);
        }

        const parentNode = this.nodes[childNode.parentID];
        if (!parentNode) {
            throw new Error(`Parent ${childNode.parentID} of child does not exist.`);
        }

        // Delete child from parent and parent from child.
        parentNode.children.delete(childID);
        childNode.parentID = '';

        // const subTreeMap = new Map<AssetID, AssetTreeNode>();
        const subTreeDict: AssetTreeNodeDict = {};
        const subTreeIDs = this.getSubtreeIDs(childID);

        // Add sub tree nodes to map and remove from this tree.
        subTreeIDs.forEach(assetID => {
            const node = this.nodes[assetID];

            if (!node) {
                throw new Error(`Subtree node ${assetID} does not exist.`);
            }

            subTreeDict[assetID] = node;
            delete this.nodes[assetID];
        });
        return new AssetTree(subTreeDict[childID], undefined, subTreeDict);
    }

    getSubtreeIDs(assetID: AssetID): Array<AssetID> {
        const currNode = this.nodes[assetID];
        if (!currNode) {
            throw new Error('The node: ' + assetID + " whose subTree are being extracted doesn't exist: ");
        }

        let IDs: Array<AssetID> = [];
        IDs.push(currNode['id']);

        currNode.children.forEach(child => {
            const subTreeIDs = this.getSubtreeIDs(child);
            IDs = IDs.concat(subTreeIDs);
        });
        return IDs;
    }

    static treeFromString(assetTreeStr: string): AssetTree {
        const reviver = (key: string, value: any) => {
            if (key === 'children') {
                return new Set(value);
            }

            return value;
        };

        const tree = JSON.parse(assetTreeStr, reviver) as AssetTree;
        const rootNode = tree.nodes[tree.rootID];

        if (!rootNode) {
            throw new Error('Tree is missing its root node, cannot convert from string');
        }

        return new AssetTree(rootNode, tree.treeID, tree.nodes);
    }

    static treeToString(assetTree: AssetTree): string {
        const replacer = (key: string, value: any) => {
            if (key === 'children') {
                return Array.from(value);
            }

            return value;
        };

        return JSON.stringify(assetTree, replacer);
    }

    size(): number {
        return Object.keys(this.nodes).length;
    }
}
