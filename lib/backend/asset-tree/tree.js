"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid = require("uuid");
require("core-js/features/map");
require("core-js/features/set");
require("core-js/features/array");
var AssetTree = /** @class */ (function () {
    function AssetTree(rootNode, treeID, nodes) {
        this.rootID = rootNode.id;
        this.treeID = treeID || uuid(); // Check for possible collision?
        this.nodes = nodes || new Map();
        this.nodes.set(this.rootID, rootNode);
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
        var childRootNode = childTree.nodes.get(childRootID);
        var parentNode = this.nodes.get(parentID);
        if (!parentNode) {
            throw new Error("Tree " + this.treeID + " does not have requested parent " + parentID + ", not adding tree.");
        }
        if (!childRootNode) {
            throw new Error("Child node " + childRootID + " is missing from tree " + childTree.treeID + ", not adding tree.");
        }
        parentNode.children.add(childRootID);
        childRootNode.parentID = parentID;
        // Check if any assets from the tree being added already exist in the tree being added to.
        childTree.nodes.forEach(function (assetNode) {
            if (_this.nodes.has(assetNode.id)) {
                throw new Error("Asset " + assetNode.id + " from tree " + childTree.treeID + " already exists in tree " + _this.treeID + ", not adding tree.");
            }
            else {
                _this.nodes.set(assetNode.id, assetNode);
            }
        });
    };
    AssetTree.prototype.addChildLeaf = function (childNode, parentID) {
        var parentNode = this.nodes.get(parentID);
        if (!parentNode) {
            throw new Error('The parent object is missing, please provide object for id: ' + parentID);
        }
        if (childNode.children.size > 0) {
            throw new Error('A new born cannot have children, Duh..');
        }
        var childID = childNode.id;
        childNode.parentID = parentID;
        if (this.nodes.has(childID)) {
            throw new Error('A child already exists with the ID ' + childID);
        }
        this.nodes.set(childID, childNode);
        parentNode.children.add(childID);
        return this;
    };
    AssetTree.prototype.removeChild = function (childID) {
        var _this = this;
        if (childID === this.rootID) {
            throw new Error(childID + " is equal to the root ID, cannot remove root.");
        }
        var childNode = this.nodes.get(childID);
        if (!childNode) {
            throw new Error("Child root " + childID + " does not exist in tree.");
        }
        var parentNode = this.nodes.get(childNode.parentID);
        if (!parentNode) {
            throw new Error("Parent " + childNode.parentID + " of child does not exist.");
        }
        // Delete child from parent and parent from child.
        parentNode.children.delete(childID);
        childNode.parentID = '';
        var subTreeMap = new Map();
        var subTreeIDs = this.getSubtreeIDs(childID);
        // Add sub tree nodes to map and remove from this tree.
        subTreeIDs.forEach(function (assetID) {
            var node = _this.nodes.get(assetID);
            if (!node) {
                throw new Error("Subtree node " + assetID + " does not exist.");
            }
            subTreeMap.set(assetID, node);
            _this.nodes.delete(assetID);
        });
        return new AssetTree(subTreeMap.get(childID), undefined, subTreeMap);
    };
    AssetTree.prototype.getSubtreeIDs = function (assetID) {
        var _this = this;
        var currNode = this.nodes.get(assetID);
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
            if (typeof value === 'object' && value !== null) {
                if (value.dataType === 'Map' && key === 'nodes') {
                    return new Map(value.value);
                }
            }
            return value;
        };
        log(JSON.parse(assetTreeStr, reviver));
        var tree = JSON.parse(assetTreeStr, reviver);
        var rootNode = tree.nodes.get(tree.rootID);
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
            if (value instanceof Map && key === 'nodes') {
                return {
                    dataType: 'Map',
                    value: Array.from(value.entries()),
                };
            }
            return value;
        };
        return JSON.stringify(assetTree, replacer);
    };
    AssetTree.prototype.size = function () {
        return this.nodes.size;
    };
    return AssetTree;
}());
exports.AssetTree = AssetTree;
