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
        this.syncAssetTypeTreeWithAssetTypes();
    }
    AssetTypeTree.prototype.createAssetTypeNode = function (newAssetTypeID, parents, children) {
        return {
            id: newAssetTypeID,
            parents: parents,
            children: children,
        };
    };
    AssetTypeTree.prototype.getTree = function () {
        return AssetTypeTree.treeToString(this.nodes);
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
    AssetTypeTree.prototype.createAssetType = function (newAssetTypeID, newAssetType, parents, children) {
        if (parents === void 0) { parents = new Set(); }
        if (children === void 0) { children = new Set(); }
        this.addAssetTypeToTree(newAssetTypeID, parents, children);
        this.addToAssetTypesCollection(newAssetType);
        this.updateAssetTypeTreeCollection();
    };
    AssetTypeTree.prototype.addAssetTypeToTree = function (newAssetTypeID, parents, children) {
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
        this.deleteFromAssetTypesCollection(assetTypeID);
        this.updateAssetTypeTreeCollection();
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
        this.updateAssetTypeTreeCollection();
    };
    AssetTypeTree.prototype.removeRelationship = function (childID, parentID) {
        this.nodes[parentID].children.delete(childID);
        this.nodes[childID].parents.delete(parentID);
        this.updateAssetTypeTreeCollection();
    };
    AssetTypeTree.prototype.updateAssetTypeTreeCollection = function () {
        var _this = this;
        var updateTreeQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TYPE_TREE }).equalTo('item_id', this.treeID);
        var changes = {
            tree: AssetTypeTree.treeToString(this.nodes),
        };
        var callback = function (err, data) {
            if (err) {
                _this.resp.error('Update Error: ' + JSON.stringify(data));
            }
        };
        updateTreeQuery.update(changes, callback);
    };
    AssetTypeTree.prototype.addToAssetTypesCollection = function (newAssetType) {
        var _this = this;
        var assetTypesCollection = ClearBlade.Collection({ collectionName: global_config_1.CollectionName.ASSET_TYPES });
        var callback = function (err, data) {
            if (err) {
                _this.resp.error('Creation Error: ' + JSON.stringify(data));
            }
        };
        var newAT = {
            id: newAssetType.id,
            label: newAssetType.label,
            description: newAssetType.description,
            icon: newAssetType.icon,
            schema: newAssetType.schema
        };
        assetTypesCollection.create(newAT, callback);
    };
    AssetTypeTree.prototype.deleteFromAssetTypesCollection = function (assetTypeID) {
        var _this = this;
        var assetTypesCollection = ClearBlade.Collection({ collectionName: global_config_1.CollectionName.ASSET_TYPES });
        var query = ClearBlade.Query().equalTo('id', assetTypeID);
        var callback = function (err, data) {
            if (err) {
                _this.resp.error('Update Error: ' + JSON.stringify(data));
            }
        };
        assetTypesCollection.remove(query, callback);
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
    // getAssetTypesFromAssetTypesCollection(): Promise<Set<AssetTypeID>> {
    //     const fetchQuery = ClearBlade.Query().columns(['id']);
    //     const assetTypesCollection = CbCollectionLib(CollectionName.ASSET_TYPES);
    //     const promise = assetTypesCollection.cbFetchPromise({
    //         query: fetchQuery,
    //     }).then(data => {
    //         if (!data.DATA) {
    //             return Promise.reject(new Error('DATA is missing.'));
    //         } 
    //         const assetTypes = new Set(data.DATA.map(assetType => (assetType as AssetType)['id'] as AssetTypeID));
    //         return Promise.resolve(assetTypes);
    //     });
    //     return promise;
    // }
    AssetTypeTree.prototype.syncAssetTypeTreeWithAssetTypes = function () {
        var _this = this;
        var fetchQuery = ClearBlade.Query({ collectionName: global_config_1.CollectionName.ASSET_TYPES }).columns(['id']);
        var callback = function (err, data) {
            if (err) {
                _this.resp.error('Error getting asset types: ' + JSON.stringify(JSON));
            }
            else {
                var typesFromAssetTypesCollection_1 = new Set(data.DATA.map(function (assetType) { return assetType['id']; }));
                var typesFromTree_1 = new Set(Object.keys(_this.nodes));
                // Types added to the asset_types collection that are not in the tree yet.
                var typesToAddToTree = Array.from(typesFromAssetTypesCollection_1).filter(function (x) { return !typesFromTree_1.has(x); });
                typesToAddToTree.forEach(function (type) {
                    _this.addAssetTypeToTree(type);
                });
                // Types removed from the asset_types collection that need to be removed from the tree.
                var typesToRemoveFromTree = Array.from(typesFromTree_1).filter(function (x) { return !typesFromAssetTypesCollection_1.has(x); });
                typesToRemoveFromTree.forEach(function (type) {
                    _this.deleteAssetType(type);
                });
            }
        };
        fetchQuery.fetch(callback);
        this.updateAssetTypeTreeCollection();
    };
    return AssetTypeTree;
}());
exports.AssetTypeTree = AssetTypeTree;
var AssetTypeTreeMethod;
(function (AssetTypeTreeMethod) {
    AssetTypeTreeMethod["GET_TREE"] = "getTree";
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
            resp.error('Error: ' + err);
        }
        else {
            var itemID = data.DATA[0]['item_id'];
            var treeStr = data.DATA[0]['tree'];
            var assetTypeTree = new AssetTypeTree(itemID, resp, AssetTypeTree.treeFromString(treeStr));
            switch (options.METHOD_NAME) {
                case AssetTypeTreeMethod.GET_TREE:
                    resp.success(assetTypeTree.getTree());
                    break;
                case AssetTypeTreeMethod.CREATE_ASSET_TYPE:
                    if (options.ASSET_TYPE_ID && options.NEW_ASSET_TYPE && options.PARENTS && options.CHILDREN) {
                        assetTypeTree.createAssetType(options.ASSET_TYPE_ID, options.NEW_ASSET_TYPE, new Set(options.PARENTS), new Set(options.CHILDREN));
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
exports.assetTypeTreeHandler = assetTypeTreeHandler;
