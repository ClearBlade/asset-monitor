import 'core-js/features/set';
export declare type AssetID = string;
export interface AssetTreeNode {
    id: AssetID;
    parentID: AssetID;
    children: Set<AssetID>;
}
export interface AssetTreeNodeDict {
    [id: string]: AssetTreeNode;
}
export declare class AssetTree {
    treeID: string;
    rootID: AssetID;
    nodes: AssetTreeNodeDict;
    constructor(rootNode: AssetTreeNode, treeID?: string, nodes?: AssetTreeNodeDict);
    static createAssetNode(id: AssetID, parentID?: AssetID, children?: Set<AssetID>): AssetTreeNode;
    addChildTree(childTree: AssetTree, parentID: AssetID): void;
    addChildLeaf(childNode: AssetTreeNode, parentID: AssetID): AssetTree;
    removeChild(childID: AssetID): AssetTree;
    getSubtreeIDs(assetID: AssetID): Array<AssetID>;
    static treeFromString(assetTreeStr: string): AssetTree;
    static treeToString(assetTree: AssetTree): string;
    size(): number;
}
