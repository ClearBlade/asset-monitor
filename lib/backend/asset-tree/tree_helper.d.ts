import { TreeNode, Tree, Trees } from './tree';
export declare function removeNode<T>(treeID: string, nodeID: string): Promise<Tree<TreeNode>>;
export declare function addNode<T>(treeID: string, node: TreeNode, parentID: string): Promise<Tree<TreeNode>>;
export declare function getTree(treeID: string): Promise<Trees<TreeNode>>;
export declare function addNewTree(newTree: Tree<TreeNode>): Promise<unknown>;
export declare function updateTree(tree: Tree<TreeNode>): Promise<unknown>;
