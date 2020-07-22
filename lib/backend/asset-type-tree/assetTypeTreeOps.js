"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
require("core-js/features/set");
require("core-js/features/array");
var AssetTypeTree = /** @class */ (function () {
    function AssetTypeTree(treeID, req, resp, assetTypeNodeDict) {
        if (assetTypeNodeDict === void 0) { assetTypeNodeDict = {}; }
        this.treeID = treeID;
        this.req = req;
        this.resp = resp;
        this.nodes = assetTypeNodeDict;
        if (!req.params.trigger) {
            this.syncAssetTypeTreeWithAssetTypes();
        }
        else {
            this.handleTrigger(req.params.trigger);
        }
    }
    AssetTypeTree.prototype.getTree = function () {
        return AssetTypeTree.treeToString(this.nodes);
    };
    AssetTypeTree.prototype.getTopLevelAssetTypes = function () {
        var _this = this;
        var topLevelAssetTypesIDs = this.getTopLevelNodeIDs();
        var topLevelAssetTypes = [];
        var callback = function (err, data) {
            if (err) {
                _this.resp.error('Error: ' + err);
            }
            else {
                topLevelAssetTypes = data;
            }
        };
        var idString = JSON.stringify(topLevelAssetTypesIDs)
            .replace('[', '(')
            .replace(']', ')');
        var db = ClearBlade.Database();
        var query = "SELECT * FROM asset_types WHERE id in " + idString;
        db.query(query, callback);
        return topLevelAssetTypes;
    };
    AssetTypeTree.prototype.createAssetType = function (createAssetTypeOptions) {
        var assetType = createAssetTypeOptions.ASSET_TYPE;
        var children = new Set(createAssetTypeOptions.CHILDREN);
        var newAssetTypeID = assetType.id;
        if (newAssetTypeID) {
            this.addAssetTypeToTree(newAssetTypeID, children);
            this.addToAssetTypesCollection(assetType);
        }
        else {
            this.resp.error('Error: Missing asset type id.');
        }
    };
    AssetTypeTree.prototype.deleteAssetType = function (deleteAssetTypeoptions) {
        var assetTypeID = deleteAssetTypeoptions.ASSET_TYPE_ID;
        this.deleteAssetTypeFromTree(assetTypeID);
        this.deleteFromAssetTypesCollection(assetTypeID);
    };
    AssetTypeTree.prototype.addChild = function (addOrRemoveChildOptions) {
        var parentID = addOrRemoveChildOptions.PARENT_ID;
        var childID = addOrRemoveChildOptions.CHILD_ID;
        var parents = this.nodes[parentID].parents;
        if (this.updateCreatesCycle(parents, new Set([childID])) || parentID === childID) {
            this.resp.error('Error: Requested relationship will cause a cycle, operation cancelled.');
            return;
        }
        this.nodes[childID].parents.add(parentID);
        this.nodes[parentID].children.add(childID);
        this.updateAssetTypeTreeCollection();
    };
    AssetTypeTree.prototype.removeChild = function (addOrRemoveChildOptions) {
        var parentID = addOrRemoveChildOptions.PARENT_ID;
        var childID = addOrRemoveChildOptions.CHILD_ID;
        this.nodes[parentID].children.delete(childID);
        this.nodes[childID].parents.delete(parentID);
        this.updateAssetTypeTreeCollection();
    };
    AssetTypeTree.prototype.getTopLevelNodeIDs = function () {
        var _this = this;
        var typeIDs = Object.keys(this.nodes);
        var topLevelAssetTypesIDs = typeIDs.filter(function (typeID) {
            if (_this.nodes[typeID].parents.size === 0) {
                return typeID;
            }
        });
        return topLevelAssetTypesIDs;
    };
    AssetTypeTree.prototype.createAssetTypeNode = function (newAssetTypeID, parents, children) {
        return {
            id: newAssetTypeID,
            parents: parents,
            children: children,
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
    AssetTypeTree.prototype.addAssetTypeToTree = function (newAssetTypeID, children) {
        var _this = this;
        if (children === void 0) { children = new Set(); }
        var assetTypeNode = this.createAssetTypeNode(newAssetTypeID, new Set(), children);
        var addToTree = true;
        // Add asset type to children.
        assetTypeNode.children.forEach(function (childID) {
            if (!(childID in _this.nodes)) {
                addToTree = false;
                _this.resp.error("Error: " + childID + " does not exist.");
            }
            else {
                _this.nodes[childID].parents.add(assetTypeNode.id);
            }
        });
        if (addToTree) {
            this.nodes[newAssetTypeID] = assetTypeNode;
        }
        this.updateAssetTypeTreeCollection();
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
            schema: newAssetType.schema,
        };
        assetTypesCollection.create(newAT, callback);
    };
    AssetTypeTree.prototype.deleteAssetTypeFromTree = function (assetTypeID) {
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
        this.updateAssetTypeTreeCollection();
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
                    _this.deleteAssetTypeFromTree(type);
                });
            }
        };
        fetchQuery.fetch(callback);
        this.updateAssetTypeTreeCollection();
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
    AssetTypeTree.prototype.handleTrigger = function (trigger) {
        var assetType = this.req.params['items'][0];
        var assetTypeID = assetType.id;
        if (trigger === 'Data::ItemCreated' && assetTypeID) {
            this.addAssetTypeToTree(assetTypeID);
        }
        else if (trigger === 'Data::ItemDeleted' && assetTypeID) {
            this.deleteAssetTypeFromTree(assetTypeID);
        }
    };
    return AssetTypeTree;
}());
exports.AssetTypeTree = AssetTypeTree;
var AssetTypeTreeMethod;
(function (AssetTypeTreeMethod) {
    AssetTypeTreeMethod["GET_TREE"] = "getTree";
    AssetTypeTreeMethod["GET_TOP_LEVEL_ASSET_TYPES"] = "getTopLevelAssetTypes";
    AssetTypeTreeMethod["CREATE_ASSET_TYPE"] = "createAssetType";
    AssetTypeTreeMethod["DELETE_ASSET_TYPE"] = "deleteAssetType";
    AssetTypeTreeMethod["ADD_CHILD"] = "addChild";
    AssetTypeTreeMethod["REMOVE_CHILD"] = "removeChild";
})(AssetTypeTreeMethod = exports.AssetTypeTreeMethod || (exports.AssetTypeTreeMethod = {}));
function isCreateAssetTypeOptions(options) {
    return options.ASSET_TYPE !== undefined;
}
function isDeleteAssetTypeOptions(options) {
    return options.ASSET_TYPE_ID !== undefined;
}
function isAddOrRemoveChildOptions(options) {
    options = options;
    return options.CHILD_ID !== undefined && options.PARENT_ID != undefined;
}
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
            var assetTypeTree = new AssetTypeTree(itemID, req, resp, AssetTypeTree.treeFromString(treeStr));
            switch (options.METHOD_NAME) {
                case AssetTypeTreeMethod.GET_TREE:
                    resp.success(assetTypeTree.getTree());
                    break;
                case AssetTypeTreeMethod.GET_TOP_LEVEL_ASSET_TYPES:
                    resp.success(assetTypeTree.getTopLevelAssetTypes());
                    break;
                case AssetTypeTreeMethod.CREATE_ASSET_TYPE:
                    if (isCreateAssetTypeOptions(options.METHOD_OPTIONS)) {
                        assetTypeTree.createAssetType(options.METHOD_OPTIONS);
                    }
                    else {
                        resp.error('Error: Missing CreateAssetTypeOptions.');
                    }
                    break;
                case AssetTypeTreeMethod.DELETE_ASSET_TYPE:
                    if (isDeleteAssetTypeOptions(options.METHOD_OPTIONS)) {
                        assetTypeTree.deleteAssetType(options.METHOD_OPTIONS);
                    }
                    else {
                        resp.error('Error: Missing DeleteAssetTypeOptions.');
                    }
                    break;
                case AssetTypeTreeMethod.REMOVE_CHILD:
                    if (isAddOrRemoveChildOptions(options.METHOD_OPTIONS)) {
                        assetTypeTree.removeChild(options.METHOD_OPTIONS);
                    }
                    else {
                        resp.error('Error: Missing AddOrRemoveChildOptions.');
                    }
                    break;
                case AssetTypeTreeMethod.ADD_CHILD:
                    if (isAddOrRemoveChildOptions(options.METHOD_OPTIONS)) {
                        assetTypeTree.addChild(options.METHOD_OPTIONS);
                    }
                    else {
                        resp.error('Error: Missing AddOrRemoveChildOptions.');
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
