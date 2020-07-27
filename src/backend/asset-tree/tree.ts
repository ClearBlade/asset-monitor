import uuid = require('uuid');
import 'core-js/features/map';

export type AssetID = string;

export interface AssetTreeNode {
    id: AssetID;
    parentID: AssetID;
    children: Set<AssetID>;
}

export class AssetTree {
    treeID: string;
    rootID: AssetID;
    nodes: Map<AssetID, AssetTreeNode>;

    constructor(rootNode: AssetTreeNode, treeID?: string, nodes?: Map<AssetID, AssetTreeNode>) {
        this.rootID = rootNode.id;
        this.treeID = treeID || uuid(); // Check for possible collision?
        this.nodes = nodes || new Map();
        this.nodes.set(this.rootID, rootNode);
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
        const childRootNode = childTree.nodes.get(childRootID);
        const parentNode = this.nodes.get(parentID);

        if (!parentNode) {
            throw new Error(`Tree ${this.treeID} does not have requested parent ${parentID}, not adding tree.`);
        }

        if (!childRootNode) {
            throw new Error(`Child node ${childRootID} is missing from tree ${childTree.treeID}, not adding tree.`);
        }

        parentNode.children.add(childRootID);
        childRootNode.parentID = parentID;

        // Check if any assets from the tree being added already exist in the tree being added to.
        childTree.nodes.forEach(assetNode => {
            if (this.nodes.has(assetNode.id)) {
                throw new Error(
                    `Asset ${assetNode.id} from tree ${childTree.treeID} already exists in tree ${this.treeID}, not adding tree.`,
                );
            } else {
                this.nodes.set(assetNode.id, assetNode);
            }
        });
    }

    addChildLeaf(childNode: AssetTreeNode, parentID: AssetID): AssetTree {
        const parentNode = this.nodes.get(parentID);

        if (!parentNode) {
            throw new Error('The parent object is missing, please provide object for id: ' + parentID);
        }

        if (childNode.children.size > 0) {
            throw new Error('A new born cannot have children, Duh..');
        }

        const childID = childNode.id;
        childNode.parentID = parentID;

        if (this.nodes.has(childID)) {
            throw new Error('A child already exists with the ID ' + childID);
        }

        this.nodes.set(childID, childNode);
        parentNode.children.add(childID);
        return this;
    }

    removeChild(childID: AssetID): AssetTree {
        if (childID === this.rootID) {
            throw new Error(`${childID} is equal to the root ID, cannot remove root.`);
        }

        const childNode = this.nodes.get(childID);
        if (!childNode) {
            throw new Error(`Child root ${childID} does not exist in tree.`);
        }

        const parentNode = this.nodes.get(childNode.parentID);
        if (!parentNode) {
            throw new Error(`Parent ${childNode.parentID} of child does not exist.`);
        }

        // Delete child from parent and parent from child.
        parentNode.children.delete(childID);
        childNode.parentID = '';

        const subTreeMap = new Map<AssetID, AssetTreeNode>();
        const subTreeIDs = this.getSubtreeIDs(childID);

        // Add sub tree nodes to map and remove from this tree.
        subTreeIDs.forEach(assetID => {
            const node = this.nodes.get(assetID);

            if (!node) {
                throw new Error(`Subtree node ${assetID} does not exist.`);
            }

            subTreeMap.set(assetID, node);
            this.nodes.delete(assetID);
        });

        return new AssetTree(subTreeMap.get(childID)!, undefined, subTreeMap);
    }

    getSubtreeIDs(assetID: AssetID): Array<AssetID> {
        const currNode = this.nodes.get(assetID);
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

            if (typeof value === 'object' && value !== null) {
                if (value.dataType === 'Map' && key === 'nodes') {
                    return new Map(value.value);
                }
            }

            return value;
        };

        const tree = JSON.parse(assetTreeStr, reviver) as AssetTree;
        const rootNode = tree.nodes.get(tree.rootID);

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

            if (value instanceof Map && key === 'nodes') {
                return {
                    dataType: 'Map',
                    value: Array.from(value.entries()),
                };
            }

            return value;
        };

        return JSON.stringify(assetTree, replacer);
    }

    size(): number {
        return this.nodes.size;
    }
}
