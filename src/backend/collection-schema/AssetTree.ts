import { Trees, TreeNode } from '../asset-tree/tree';
export interface AssetTree {
    id?: string;
    tree?: Trees<TreeNode>;
}
