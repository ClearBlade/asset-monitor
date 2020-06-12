export interface TreeNode {
    id: string;
    children: Array<TreeNode['id']>;
    meta: Record<string, unknown>;
    parentID: string;
}
export interface NodeDict<T extends TreeNode> {
    [key: string]: T;
}
export interface Trees<T extends TreeNode> {
    rootID: string;
    nodes: NodeDict<T>;
}
export declare class Tree<T extends TreeNode> implements Trees<T> {
    id: string;
    constructor(rootNode: T);
    rootID: string;
    nodes: NodeDict<T>;
    createNewTree(rootID: TreeNode['id'], treeNodes: NodeDict<T>): Tree<T>;
    findNodeByID(nodeID: string): T;
    addChild(node: T, parentID: T['id']): Tree<T>;
    getAllNodes(): NodeDict<T>;
    removeChild(nodeID: string): Tree<T>;
    getSubtreeIDs(nodeID: string): Array<TreeNode['id']>;
    getSubtreeByID(nodeID: string): Tree<T>;
    getTree(): Trees<T>;
}
export declare function CreateNewTree(tree: Trees<TreeNode>): Tree<TreeNode>;
