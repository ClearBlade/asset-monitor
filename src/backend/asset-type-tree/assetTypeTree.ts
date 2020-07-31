import 'core-js/features/set';
import 'core-js/features/array';

export type AssetTypeID = string;

export interface AssetTypeNode {
    id: AssetTypeID;
    parents: Set<AssetTypeID>;
    children: Set<AssetTypeID>;
}

export interface AssetTypeNodeDict {
    [id: string]: AssetTypeNode;
}

export class AssetTypeTree {
    nodes: AssetTypeNodeDict;

    constructor(assetTypeNodeDict: AssetTypeNodeDict = {}) {
        this.nodes = assetTypeNodeDict;
    }

    addChild(childID: AssetTypeID, parentID: AssetTypeID): void {
        if (childID === parentID) throw new Error('Child and parent cannot be the same.');
        if (!this.nodes[childID]) throw new Error(`${childID} does not exist.`);
        if (!this.nodes[parentID]) throw new Error(`${parentID} does not exist.`);
        if (this.nodes[parentID].children.has(childID))
            throw new Error(`${childID} is already a child of ${parentID}.`);

        if (this.updateCreatesCycle(childID, parentID)) {
            throw new Error('Error: Requested relationship will cause a cycle, operation cancelled.');
        }

        this.nodes[childID].parents.add(parentID);
        this.nodes[parentID].children.add(childID);
    }

    removeChild(childID: AssetTypeID, parentID: AssetTypeID): void {
        if (!this.nodes[childID]) throw new Error(`${childID} does not exist.`);
        if (!this.nodes[parentID]) throw new Error(`${parentID} does not exist.`);
        if (!this.nodes[parentID].children.has(childID))
            throw new Error(`${childID} was already not a child of ${parentID}.`);

        this.nodes[parentID].children.delete(childID);
        this.nodes[childID].parents.delete(parentID);
    }

    getTopLevelAssetTypeIDs(): AssetTypeID[] {
        const typeIDs = Object.keys(this.nodes);
        const topLevelAssetTypesIDs = typeIDs.filter(typeID => {
            if (this.nodes[typeID].parents.size === 0) {
                return typeID;
            }
        });

        return topLevelAssetTypesIDs;
    }

    private createAssetTypeNode(
        assetTypeID: AssetTypeID,
        parents: Set<AssetTypeID>,
        children: Set<AssetTypeID>,
    ): AssetTypeNode {
        return {
            id: assetTypeID,
            parents: parents,
            children: children,
        };
    }

    private updateCreatesCycle(childID: AssetTypeID, parentID: AssetTypeID): boolean {
        const children = new Set([childID]);
        const parents = this.nodes[parentID].parents;
        // BFS 'up' through the parents and check if a parent is in the children.
        // If a parent is in the children set, this means there is a cycle.
        let queue = Array.from(parents);
        while (queue.length !== 0) {
            const nodeID = queue.shift();
            if (nodeID && children.has(nodeID)) {
                return true;
            } else if (nodeID) {
                queue = queue.concat(Array.from(this.nodes[nodeID].parents) || []);
            }
        }

        return false;
    }

    addAssetTypeToTree(assetTypeID: AssetTypeID): void {
        if (this.nodes[assetTypeID]) throw new Error(`${assetTypeID} already exists.`);

        const assetTypeNode = this.createAssetTypeNode(assetTypeID, new Set(), new Set());
        this.nodes[assetTypeID] = assetTypeNode;
    }

    deleteAssetTypeFromTree(assetTypeID: AssetTypeID): void {
        if (!this.nodes[assetTypeID]) throw new Error(`${assetTypeID} does not exist, there is nothing to remove.`);

        // Delete asset type from parents.
        this.nodes[assetTypeID].parents.forEach(parentID => {
            this.nodes[parentID].children.delete(assetTypeID);
        });
        // Delete asset type from children.
        this.nodes[assetTypeID].children.forEach(childID => {
            this.nodes[childID].parents.delete(assetTypeID);
        });

        delete this.nodes[assetTypeID];
    }

    static treeToString(assetTypeTree: AssetTypeTree): string {
        const replacer = (key: string, value: unknown): unknown => {
            if (key === 'children' || key === 'parents') {
                return Array.from(value as Set<AssetTypeID>);
            }
            return value;
        };

        return JSON.stringify(assetTypeTree.nodes, replacer);
    }

    static treeFromString(assetTypeTreeStr: string): AssetTypeTree {
        const reviver = (key: string, value: unknown): unknown => {
            if (key === 'children' || key === 'parents') {
                return new Set(value as Array<AssetTypeID>);
            }
            return value;
        };

        return new AssetTypeTree(JSON.parse(assetTypeTreeStr, reviver));
    }
}
