"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid = require("uuid");
require("core-js/features/set");
var AssetTree = /** @class */ (function () {
    function AssetTree(rootNode, treeID, nodes) {
        this.rootID = rootNode.id;
        this.treeID = treeID || uuid();
        this.nodes = nodes || {};
        this.nodes[this.rootID] = rootNode;
    }
    AssetTree.createAssetNode = function (id, parentID, children) {
        return {
            id: id,
            parentID: parentID || '',
            children: children || new Set(),
        };
    };
    AssetTree.prototype.addChildTree = function (childTree, parentID) {
        var _this = this;
        var childRootID = childTree.rootID;
        var childRootNode = childTree.nodes[childRootID];
        var parentNode = this.nodes[parentID];
        if (!parentNode) {
            throw new Error("Tree " + this.treeID + " does not have requested parent " + parentID + ", not adding tree.");
        }
        if (!childRootNode) {
            throw new Error("Child node " + childRootID + " is missing from tree " + childTree.treeID + ", not adding tree.");
        }
        parentNode.children.add(childRootID);
        childRootNode.parentID = parentID;
        // Check if any assets from the tree being added already exist in the tree being added to.
        Object.keys(childTree.nodes).forEach(function (assetNodeID) {
            if (_this.nodes[assetNodeID]) {
                throw new Error("Asset " + assetNodeID + " from tree " + childTree.treeID + " already exists in tree " + _this.treeID + ", not adding tree.");
            }
            else {
                _this.nodes[assetNodeID] = childTree.nodes[assetNodeID];
            }
        });
    };
    AssetTree.prototype.addChildLeaf = function (childNode, parentID) {
        var parentNode = this.nodes[parentID];
        if (!parentNode) {
            throw new Error('The parent object is missing, please provide object for id: ' + parentID);
        }
        if (childNode.children.size > 0) {
            throw new Error('A new born cannot have children, Duh..');
        }
        var childID = childNode.id;
        childNode.parentID = parentID;
        if (this.nodes[childID]) {
            throw new Error('A child already exists with the ID ' + childID);
        }
        this.nodes[childID] = childNode;
        parentNode.children.add(childID);
        return this;
    };
    AssetTree.prototype.removeChild = function (childID) {
        var _this = this;
        if (childID === this.rootID) {
            throw new Error(childID + " is equal to the root ID, cannot remove root.");
        }
        var childNode = this.nodes[childID];
        if (!childNode) {
            throw new Error("Child root " + childID + " does not exist in tree.");
        }
        var parentNode = this.nodes[childNode.parentID];
        if (!parentNode) {
            throw new Error("Parent " + childNode.parentID + " of child does not exist.");
        }
        // Delete child from parent and parent from child.
        parentNode.children.delete(childID);
        childNode.parentID = '';
        // const subTreeMap = new Map<AssetID, AssetTreeNode>();
        var subTreeDict = {};
        var subTreeIDs = this.getSubtreeIDs(childID);
        // Add sub tree nodes to map and remove from this tree.
        subTreeIDs.forEach(function (assetID) {
            var node = _this.nodes[assetID];
            if (!node) {
                throw new Error("Subtree node " + assetID + " does not exist.");
            }
            subTreeDict[assetID] = node;
            delete _this.nodes[assetID];
        });
        return new AssetTree(subTreeDict[childID], undefined, subTreeDict);
    };
    AssetTree.prototype.getSubtreeIDs = function (assetID) {
        var _this = this;
        var currNode = this.nodes[assetID];
        if (!currNode) {
            throw new Error('The node: ' + assetID + " whose subTree are being extracted doesn't exist: ");
        }
        var IDs = [];
        IDs.push(currNode['id']);
        currNode.children.forEach(function (child) {
            var subTreeIDs = _this.getSubtreeIDs(child);
            IDs = IDs.concat(subTreeIDs);
        });
        return IDs;
    };
    AssetTree.treeFromString = function (assetTreeStr) {
        var reviver = function (key, value) {
            if (key === 'children') {
                return new Set(value);
            }
            return value;
        };
        var tree = JSON.parse(assetTreeStr, reviver);
        var rootNode = tree.nodes[tree.rootID];
        if (!rootNode) {
            throw new Error('Tree is missing its root node, cannot convert from string');
        }
        return new AssetTree(rootNode, tree.treeID, tree.nodes);
    };
    AssetTree.treeToString = function (assetTree) {
        var replacer = function (key, value) {
            if (key === 'children') {
                return Array.from(value);
            }
            return value;
        };
        return JSON.stringify(assetTree, replacer);
    };
    AssetTree.prototype.size = function () {
        return Object.keys(this.nodes).length;
    };
    return AssetTree;
}());
exports.AssetTree = AssetTree;
