import { CollectionName } from '../global-config';
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
    treeID: string;
    resp: CbServer.Resp;
    nodes: AssetTypeNodeDict;

    constructor(treeID: string, resp: CbServer.Resp, assetTypeNodeDict: AssetTypeNodeDict = {}) {
        this.treeID = treeID;
        this.resp = resp;
        this.nodes = assetTypeNodeDict;
    }

    private createAssetTypeNode(
        newAssetTypeID: AssetTypeID,
        parents: Set<AssetTypeID>,
        children: Set<AssetTypeID>,
    ): AssetTypeNode {
        return {
            id: newAssetTypeID,
            parents: parents,
            children: children,
        };
    }

    updateCreatesCycle(parents: Set<AssetTypeID>, children: Set<AssetTypeID>): boolean {
        // BFS 'up' through the parents and check if a parent is in the children.
        // If a parent is in the children set, this means there is a cycle.
        let queue = Array.from(parents);
        while (queue.length !== 0) {
            const node = queue.shift();
            if (node && children.has(node)) {
                return true;
            } else if (node) {
                queue = queue.concat(Array.from(this.nodes[node]?.parents));
            }
        }
        return false;
    }

    createAssetType(
        newAssetTypeID: AssetTypeID,
        parents: Set<AssetTypeID> = new Set(),
        children: Set<AssetTypeID> = new Set(),
    ): void {
        if (this.updateCreatesCycle(parents, children)) {
            log('This will create a cycle, not adding asset type...');
            this.resp.error('Error: Requested relationship will cause a cycle, operation cancelled.');
            return;
        }

        const assetTypeNode = this.createAssetTypeNode(newAssetTypeID, parents, children);
        this.nodes[newAssetTypeID] = assetTypeNode;

        // Add asset type to parents.
        assetTypeNode.parents.forEach(parentID => {
            this.nodes[parentID]?.children.add(assetTypeNode.id);
        });

        // Add asset type to children.
        assetTypeNode.children.forEach(childID => {
            if (!(childID in this.nodes)) {
                const childNode = this.createAssetTypeNode(childID, new Set(), new Set());
                this.nodes[childID] = childNode;
            }
            this.nodes[childID].parents.add(assetTypeNode.id);
        });

        this.updateCollection();
    }

    deleteAssetType(assetTypeID: AssetTypeID): void {
        // Delete asset type from parents.
        this.nodes[assetTypeID].parents.forEach(parentID => {
            this.nodes[parentID].children.delete(assetTypeID);
        });
        // Delete asset type from children.
        this.nodes[assetTypeID].children.forEach(childID => {
            this.nodes[childID].parents.delete(assetTypeID);
        });

        delete this.nodes[assetTypeID];
        this.updateCollection();
    }

    addRelationship(childID: AssetTypeID, parentID: AssetTypeID): void {
        const parents = this.nodes[parentID].parents;
        if (this.updateCreatesCycle(parents, new Set([childID]))) {
            log('This will create a cycle, not adding relationship...');
            this.resp.error('Error: Requested relationship will cause a cycle, operation cancelled.');
            return;
        }

        this.nodes[childID].parents.add(parentID);
        this.nodes[parentID].children.add(childID);

        this.updateCollection();
    }

    removeRelationship(childID: AssetTypeID, parentID: AssetTypeID): void {
        this.nodes[parentID].children.delete(childID);
        this.nodes[childID].parents.delete(parentID);

        this.updateCollection();
    }

    updateCollection(): void {
        const updateTreeQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TYPE_TREE }).equalTo(
            'item_id',
            this.treeID,
        );

        const changes = {
            tree: AssetTypeTree.treeToString(this.nodes),
        };

        const callback = (err: any, data: any): void => {
            if (err) {
                this.resp.error('Error updating: ' + JSON.stringify(data));
            } else {
                // this.resp.success(data);
                this.resp.send(AssetTypeTree.treeToString(this.nodes));
            }
        };

        updateTreeQuery.update(changes, callback);
    }

    static treeToString(assetTypeTree: AssetTypeNodeDict): string {
        const replacer = (key: string, value: any) => {
            if (key === 'children' || key === 'parents') {
                return Array.from(value);
            }
            return value;
        };
        return JSON.stringify(assetTypeTree, replacer);
    }

    static treeFromString(assetTypeTreeStr: string): AssetTypeNodeDict {
        const reviver = (key: string, value: any) => {
            if (key === 'children' || key === 'parents') {
                return new Set(value);
            }
            return value;
        };
        return JSON.parse(assetTypeTreeStr, reviver);
    }
}

export enum AssetTypeTreeMethod {
    CREATE_ASSET_TYPE = 'createAssetType',
    DELETE_ASSET_TYPE = 'deleteAssetType',
    REMOVE_RELATIONSHIP = 'removeRelationship',
    ADD_RELATIONSHIP = 'addRelationship',
}

export interface AssetTypeTreeOptions {
    METHOD_NAME: AssetTypeTreeMethod;
    ASSET_TYPE_ID?: AssetTypeID;
    PARENTS?: Array<AssetTypeID>;
    CHILDREN?: Array<AssetTypeID>;
    CHILD_ID?: AssetTypeID;
    PARENT_ID?: AssetTypeID;
}

export function assetTypeTreeHandler(req: CbServer.BasicReq, resp: CbServer.Resp, options: AssetTypeTreeOptions): void {
    const assetTypeTreeCollection = ClearBlade.Collection({ collectionName: CollectionName.ASSET_TYPE_TREE });
    const getTreeQuery = ClearBlade.Query().setPage(1, 1);

    const callback = (err: any, data: any) => {
        if (err) {
            resp.error('Error: ' + err.toString());
        } else {
            const itemID = data.DATA[0]['item_id'];
            const treeStr = data.DATA[0]['tree'];
            const assetTypeTree = new AssetTypeTree(itemID, resp, AssetTypeTree.treeFromString(treeStr));

            switch (options.METHOD_NAME) {
                case AssetTypeTreeMethod.CREATE_ASSET_TYPE:
                    if (options.ASSET_TYPE_ID && options.PARENTS && options.CHILDREN) {
                        assetTypeTree.createAssetType(
                            options.ASSET_TYPE_ID,
                            new Set(options.PARENTS),
                            new Set(options.CHILDREN),
                        );
                    }
                    break;
                case AssetTypeTreeMethod.DELETE_ASSET_TYPE:
                    if (options.ASSET_TYPE_ID) {
                        assetTypeTree.deleteAssetType(options.ASSET_TYPE_ID);
                    }
                    break;
                case AssetTypeTreeMethod.REMOVE_RELATIONSHIP:
                    if (options.CHILD_ID && options.PARENT_ID) {
                        assetTypeTree.removeRelationship(options.CHILD_ID, options.PARENT_ID);
                    }
                    break;
                case AssetTypeTreeMethod.ADD_RELATIONSHIP:
                    if (options.CHILD_ID && options.PARENT_ID) {
                        assetTypeTree.addRelationship(options.CHILD_ID, options.PARENT_ID);
                    }
                    break;
                default:
                    break;
            }
            // assetTypeTree.updateCollection();
        }
    };

    assetTypeTreeCollection.fetch(getTreeQuery, callback);
}
