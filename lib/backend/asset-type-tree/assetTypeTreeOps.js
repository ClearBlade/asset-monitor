"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
require("core-js/features/set");
require("core-js/features/array");
var AssetTypeTree = /** @class */ (function () {
    function AssetTypeTree(treeID, resp, assetTypeNodeDict) {
        if (assetTypeNodeDict === void 0) { assetTypeNodeDict = {}; }
        this.treeID = treeID;
        this.resp = resp;
        this.nodes = assetTypeNodeDict;
    }
    AssetTypeTree.prototype.createAssetTypeNode = function (newAssetTypeID, parents, children) {
        return {
            id: newAssetTypeID,
            parents: parents,
            children: children
        };
    };
    AssetTypeTree.prototype.updateCreatesCycle = function (parents, children) {
        var _a;
        // BFS 'up' through the parents and check if a parent is in the children.
        // If a parent is in the children set, this means there is a cycle.
        var queue = Array.from(parents);
        while (queue.length !== 0) {
            var node = queue.shift();
            if (node && children.has(node)) {
                return true;
            }
            else if (node) {
                queue = queue.concat(Array.from((_a = this.nodes[node]) === null || _a === void 0 ? void 0 : _a.parents));
            }
        }
        return false;
    };
    AssetTypeTree.prototype.createAssetType = function (newAssetTypeID, parents, children) {
        var _this = this;
        if (parents === void 0) { parents = new Set(); }
        if (children === void 0) { children = new Set(); }
        if (this.updateCreatesCycle(parents, children)) {
            log('This will create a cycle, not adding asset type...');
            this.resp.error('Error: Requested relationship will cause a cycle, operation cancelled.');
            return;
        }
        var assetTypeNode = this.createAssetTypeNode(newAssetTypeID, parents, children);
        this.nodes[newAssetTypeID] = assetTypeNode;
        // Add asset type to parents.
        assetTypeNode.parents.forEach(function (parentID) {
            var _a;
            (_a = _this.nodes[parentID]) === null || _a === void 0 ? void 0 : _a.children.add(assetTypeNode.id);
        });
        // Add asset type to children.
        assetTypeNode.children.forEach(function (childID) {
            if (!(childID in _this.nodes)) {
                var childNode = _this.createAssetTypeNode(childID, new Set(), new Set());
                _this.nodes[childID] = childNode;
            }
            _this.nodes[childID].parents.add(assetTypeNode.id);
        });
        this.updateCollection();
    };
    AssetTypeTree.prototype.deleteAssetType = function (assetTypeID) {
        var _this = this;
        // Delete asset type from parents.
        this.nodes[assetTypeID].parents.forEach(function (parentID) {
            _this.nodes[parentID].children.delete(assetTypeID);
        });
        // Delete asset type from children.
        this.nodes[assetTypeID].children.forEach(function (childID) {
            _this.nodes[childID].parents.delete(assetTypeID);
        });
        delete this.nodes[assetTypeID];
        this.updateCollection();
    };
    AssetTypeTree.prototype.addRelationship = function (childID, parentID) {
        var parents = this.nodes[parentID].parents;
        if (this.updateCreatesCycle(parents, new Set([childID]))) {
            log('This will create a cycle, not adding relationship...');
            this.resp.error('Error: Requested relationship will cause a cycle, operation cancelled.');
            return;
        }
        this.nodes[childID].parents.add(parentID);
        this.nodes[parentID].children.add(childID);
        this.updateCollection();
    };
    AssetTypeTree.prototype.removeRelationship = function (childID, parentID) {
        this.nodes[parentID].children.delete(childID);
        this.nodes[childID].parents.delete(parentID);
        this.updateCollection();
    };
    AssetTypeTree.prototype.updateCollection = function () {
        var _this = this;
        var updateTreeQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TYPE_TREE }).equalTo('item_id', this.treeID);
        var changes = {
            tree: AssetTypeTree.treeToString(this.nodes),
        };
        var callback = function (err, data) {
            if (err) {
                _this.resp.error('Error updating: ' + JSON.stringify(data));
            }
            else {
                // this.resp.success(data);
                _this.resp.send(AssetTypeTree.treeToString(_this.nodes));
            }
        };
        updateTreeQuery.update(changes, callback);
    };
    AssetTypeTree.treeToString = function (assetTypeTree) {
        var replacer = function (key, value) {
            if (key === 'children' || key === 'parents') {
                return Array.from(value);
            }
            return value;
        };
        return JSON.stringify(assetTypeTree, replacer);
    };
    AssetTypeTree.treeFromString = function (assetTypeTreeStr) {
        var reviver = function (key, value) {
            if (key === 'children' || key === 'parents') {
                return new Set(value);
            }
            return value;
        };
        return JSON.parse(assetTypeTreeStr, reviver);
    };
    return AssetTypeTree;
}());
exports.AssetTypeTree = AssetTypeTree;
var AssetTypeTreeMethod;
(function (AssetTypeTreeMethod) {
    AssetTypeTreeMethod["CREATE_ASSET_TYPE"] = "createAssetType";
    AssetTypeTreeMethod["DELETE_ASSET_TYPE"] = "deleteAssetType";
    AssetTypeTreeMethod["REMOVE_RELATIONSHIP"] = "removeRelationship";
    AssetTypeTreeMethod["ADD_RELATIONSHIP"] = "addRelationship";
})(AssetTypeTreeMethod = exports.AssetTypeTreeMethod || (exports.AssetTypeTreeMethod = {}));
function assetTypeTreeHandler(req, resp, options) {
    var assetTypeTreeCollection = ClearBlade.Collection({ collectionName: global_config_1.CollectionName.ASSET_TYPE_TREE });
    var getTreeQuery = ClearBlade.Query().setPage(1, 1);
    var callback = function (err, data) {
        if (err) {
            resp.error('Error: ' + err.toString());
        }
        else {
            var itemID = data.DATA[0]['item_id'];
            var treeStr = data.DATA[0]['tree'];
            var assetTypeTree = new AssetTypeTree(itemID, resp, AssetTypeTree.treeFromString(treeStr));
            switch (options.METHOD_NAME) {
                case AssetTypeTreeMethod.CREATE_ASSET_TYPE:
                    assetTypeTree.createAssetType(options.ASSET_TYPE_ID, new Set(options.PARENTS), new Set(options.CHILDREN));
                    break;
                case AssetTypeTreeMethod.DELETE_ASSET_TYPE:
                    assetTypeTree.deleteAssetType(options.ASSET_TYPE_ID);
                    break;
                case AssetTypeTreeMethod.REMOVE_RELATIONSHIP:
                    assetTypeTree.removeRelationship(options.CHILD_ID, options.PARENT_ID);
                    break;
                case AssetTypeTreeMethod.ADD_RELATIONSHIP:
                    assetTypeTree.addRelationship(options.CHILD_ID, options.PARENT_ID);
                    break;
                default:
                    break;
            }
            // assetTypeTree.updateCollection();
        }
    };
    assetTypeTreeCollection.fetch(getTreeQuery, callback);
}
exports.assetTypeTreeHandler = assetTypeTreeHandler;
