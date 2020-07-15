import { CollectionName } from '../global-config';
import { AssetType } from '../collection-schema/AssetType';
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
        this.syncAssetTypeTreeWithAssetTypes();
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

    getTree(): string {
        return AssetTypeTree.treeToString(this.nodes);
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
        newAssetType: AssetType,
        parents: Set<AssetTypeID> = new Set(),
        children: Set<AssetTypeID> = new Set(),
    ): void {
        this.addToAssetTypesCollection(newAssetType);
        this.addAssetTypeToTree(newAssetTypeID, parents, children);
        this.updateAssetTypeTreeCollection();
    }

    addAssetTypeToTree(
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

        this.deleteFromAssetTypesCollection(assetTypeID);
        this.updateAssetTypeTreeCollection();
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

        this.updateAssetTypeTreeCollection();
    }

    removeRelationship(childID: AssetTypeID, parentID: AssetTypeID): void {
        this.nodes[parentID].children.delete(childID);
        this.nodes[childID].parents.delete(parentID);

        this.updateAssetTypeTreeCollection();
    }

    updateAssetTypeTreeCollection(): void {
        const updateTreeQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TYPE_TREE }).equalTo(
            'item_id',
            this.treeID,
        );

        const changes = {
            tree: AssetTypeTree.treeToString(this.nodes),
        };

        const callback = (err: any, data: any): void => {
            if (err) {
                this.resp.error('Update Error: ' + JSON.stringify(data));
            }
        };

        updateTreeQuery.update(changes, callback);
    }

    addToAssetTypesCollection(newAssetType: AssetType) {
        const assetTypesCollection = ClearBlade.Collection({ collectionName: CollectionName.ASSET_TYPES });

        const callback = (err: any, data: any) => {
            if (err) {
                this.resp.error('Creation Error: ' + JSON.stringify(data));
            }
        };

        const newAT = {
            id: newAssetType.id,
            label: newAssetType.label,
            description: newAssetType.description,
            icon: newAssetType.icon,
            schema: newAssetType.schema,
        };

        assetTypesCollection.create(newAT, callback);
    }

    deleteFromAssetTypesCollection(assetTypeID: AssetTypeID): void {
        const assetTypesCollection = ClearBlade.Collection({ collectionName: CollectionName.ASSET_TYPES });
        const query = ClearBlade.Query().equalTo('id', assetTypeID);

        const callback = (err: any, data: any) => {
            if (err) {
                this.resp.error('Update Error: ' + JSON.stringify(data));
            }
        };

        assetTypesCollection.remove(query, callback);
    }

    syncAssetTypeTreeWithAssetTypes() {
        const fetchQuery = ClearBlade.Query({ collectionName: CollectionName.ASSET_TYPES }).columns(['id']);

        // TODO: Account for updates to asset type id.
        const callback = (err: any, data: any) => {
            if (err) {
                this.resp.error('Error getting asset types: ' + JSON.stringify(JSON));
            } else {
                const typesFromAssetTypesCollection: Set<AssetTypeID> = new Set(
                    data.DATA.map((assetType: AssetType) => assetType['id'] as AssetTypeID),
                );
                const typesFromTree = new Set(Object.keys(this.nodes));

                // Types added to the asset_types collection that are not in the tree yet.
                const typesToAddToTree = Array.from(typesFromAssetTypesCollection).filter(x => !typesFromTree.has(x));
                typesToAddToTree.forEach(type => {
                    this.addAssetTypeToTree(type);
                });

                // Types removed from the asset_types collection that need to be removed from the tree.
                const typesToRemoveFromTree = Array.from(typesFromTree).filter(
                    x => !typesFromAssetTypesCollection.has(x),
                );
                typesToRemoveFromTree.forEach(type => {
                    this.deleteAssetType(type);
                });
            }
        };

        fetchQuery.fetch(callback);
        this.updateAssetTypeTreeCollection();
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
    GET_TREE = 'getTree',
    CREATE_ASSET_TYPE = 'createAssetType',
    DELETE_ASSET_TYPE = 'deleteAssetType',
    REMOVE_RELATIONSHIP = 'removeRelationship',
    ADD_RELATIONSHIP = 'addRelationship',
}

export interface AssetTypeTreeOptions {
    METHOD_NAME: AssetTypeTreeMethod;
    ASSET_TYPE_ID?: AssetTypeID;
    NEW_ASSET_TYPE?: AssetType;
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
            resp.error('Error: ' + err);
        } else {
            const itemID = data.DATA[0]['item_id'];
            const treeStr = data.DATA[0]['tree'];
            const assetTypeTree = new AssetTypeTree(itemID, resp, AssetTypeTree.treeFromString(treeStr));

            switch (options.METHOD_NAME) {
                case AssetTypeTreeMethod.GET_TREE:
                    resp.success(assetTypeTree.getTree());
                    break;
                case AssetTypeTreeMethod.CREATE_ASSET_TYPE:
                    if (options.ASSET_TYPE_ID && options.NEW_ASSET_TYPE && options.PARENTS && options.CHILDREN) {
                        assetTypeTree.createAssetType(
                            options.ASSET_TYPE_ID,
                            options.NEW_ASSET_TYPE,
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
            resp.success(AssetTypeTree.treeToString(assetTypeTree.nodes));
        }
    };

    assetTypeTreeCollection.fetch(getTreeQuery, callback);
}
