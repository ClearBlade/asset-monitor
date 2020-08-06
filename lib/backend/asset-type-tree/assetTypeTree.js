"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("core-js/features/set");
require("core-js/features/array");
var AssetTypeTree = /** @class */ (function () {
    function AssetTypeTree(assetTypeNodeDict) {
        if (assetTypeNodeDict === void 0) { assetTypeNodeDict = {}; }
        this.nodes = assetTypeNodeDict;
    }
    AssetTypeTree.prototype.addChild = function (childID, parentID) {
        if (childID === parentID)
            throw new Error('Child and parent cannot be the same.');
        if (!this.nodes[childID])
            throw new Error(childID + " does not exist.");
        if (!this.nodes[parentID])
            throw new Error(parentID + " does not exist.");
        if (this.nodes[parentID].children.has(childID))
            throw new Error(childID + " is already a child of " + parentID + ".");
        if (this.updateCreatesCycle(childID, parentID)) {
            throw new Error('Error: Requested relationship will cause a cycle, operation cancelled.');
        }
        this.nodes[childID].parents.add(parentID);
        this.nodes[parentID].children.add(childID);
    };
    AssetTypeTree.prototype.removeChild = function (childID, parentID) {
        if (!this.nodes[childID])
            throw new Error(childID + " does not exist.");
        if (!this.nodes[parentID])
            throw new Error(parentID + " does not exist.");
        if (!this.nodes[parentID].children.has(childID))
            throw new Error(childID + " was already not a child of " + parentID + ".");
        this.nodes[parentID].children.delete(childID);
        this.nodes[childID].parents.delete(parentID);
    };
    AssetTypeTree.prototype.getTopLevelAssetTypeIDs = function () {
        var _this = this;
        var typeIDs = Object.keys(this.nodes);
        var topLevelAssetTypesIDs = typeIDs.filter(function (typeID) {
            if (_this.nodes[typeID].parents.size === 0) {
                return typeID;
            }
        });
        return topLevelAssetTypesIDs;
    };
    AssetTypeTree.prototype.createAssetTypeNode = function (assetTypeID, parents, children) {
        return {
            id: assetTypeID,
            parents: parents,
            children: children,
        };
    };
    AssetTypeTree.prototype.updateCreatesCycle = function (childID, parentID) {
        var children = new Set([childID]);
        var parents = this.nodes[parentID].parents;
        // BFS 'up' through the parents and check if a parent is in the children.
        // If a parent is in the children set, this means there is a cycle.
        var queue = Array.from(parents);
        while (queue.length !== 0) {
            var nodeID = queue.shift();
            if (nodeID && children.has(nodeID)) {
                return true;
            }
            else if (nodeID) {
                queue = queue.concat(Array.from(this.nodes[nodeID].parents) || []);
            }
        }
        return false;
    };
    AssetTypeTree.prototype.addAssetTypeToTree = function (assetTypeID) {
        if (this.nodes[assetTypeID])
            throw new Error(assetTypeID + " already exists.");
        var assetTypeNode = this.createAssetTypeNode(assetTypeID, new Set(), new Set());
        this.nodes[assetTypeID] = assetTypeNode;
    };
    AssetTypeTree.prototype.deleteAssetTypeFromTree = function (assetTypeID) {
        var _this = this;
        if (!this.nodes[assetTypeID])
            throw new Error(assetTypeID + " does not exist, there is nothing to remove.");
        // Delete asset type from parents.
        this.nodes[assetTypeID].parents.forEach(function (parentID) {
            _this.nodes[parentID].children.delete(assetTypeID);
        });
        // Delete asset type from children.
        this.nodes[assetTypeID].children.forEach(function (childID) {
            _this.nodes[childID].parents.delete(assetTypeID);
        });
        delete this.nodes[assetTypeID];
    };
    AssetTypeTree.treeToString = function (assetTypeTree) {
        var replacer = function (key, value) {
            if (key === 'children' || key === 'parents') {
                return Array.from(value);
            }
            return value;
        };
        return JSON.stringify(assetTypeTree.nodes, replacer);
    };
    AssetTypeTree.treeFromString = function (assetTypeTreeStr) {
        var reviver = function (key, value) {
            if (key === 'children' || key === 'parents') {
                return new Set(value);
            }
            return value;
        };
        return new AssetTypeTree(JSON.parse(assetTypeTreeStr, reviver));
    };
    return AssetTypeTree;
}());
exports.AssetTypeTree = AssetTypeTree;
