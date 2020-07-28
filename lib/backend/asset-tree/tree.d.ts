import 'core-js/features/map';
export declare type AssetID = string;
export interface AssetTreeNode {
    id: AssetID;
    parentID: AssetID;
    children: Set<AssetID>;
}
export declare class AssetTree {
    treeID: string;
    rootID: AssetID;
    nodes: Map<AssetID, AssetTreeNode>;
    constructor(rootNode: AssetTreeNode, treeID?: string, nodes?: Map<AssetID, AssetTreeNode>);
    static createAssetNode(id: AssetID, parentID?: AssetID, children?: Set<AssetID>): AssetTreeNode;
    addChildTree(childTree: AssetTree, parentID: AssetID): void;
    addChildLeaf(childNode: AssetTreeNode, parentID: AssetID): AssetTree;
    removeChild(childID: AssetID): AssetTree;
    getSubtreeIDs(assetID: AssetID): Array<AssetID>;
    static treeFromString(assetTreeStr: string): AssetTree;
    static treeToString(assetTree: AssetTree): string;
    size(): number;
}
