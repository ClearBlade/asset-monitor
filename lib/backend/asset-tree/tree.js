"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var uuid = require("uuid");
var Tree = /** @class */ (function () {
    function Tree(rootNode, treeID) {
        this.rootID = rootNode['id'];
        this.nodes = {};
        this.nodes[this.rootID] = __assign({}, rootNode);
        this.treeID = treeID || uuid();
    }
    Tree.prototype.createNewTree = function (rootID, treeNodes) {
        var tree = new Tree(treeNodes[rootID], '');
        tree.nodes = treeNodes;
        return tree;
    };
    Tree.prototype.findNodeByID = function (nodeID) {
        //returns T from the nodes object
        throw new Error('Method not implemented.' + nodeID);
    };
    Tree.prototype.addChild = function (node, parentID) {
        //adds child to the parent node's list
        //adds child T to the NodeDict
        //returns tree as promise
        if (!node.children) {
            throw new Error('children key is missing in the node..');
        }
        if (node.children.length > 0) {
            throw new Error('A new born cannot have children, Duh..');
        }
        var parentNode = this.nodes[parentID];
        var childID = node['id'];
        var child = __assign(__assign({}, node), { parentID: parentID });
        this.nodes[childID] = child;
        parentNode.children.push(childID);
        return this;
    };
    Tree.prototype.getAllNodes = function () {
        //returns the nodes' object/dict
        //throw new Error('Method not implemented.');
        return this.nodes;
    };
    Tree.prototype.removeChild = function (nodeID) {
        //creates a new Tree
        //removes the child & it's children recursively
        //add them to the new Tree
        var _this = this;
        //deleting the root is not allowed in this function
        if (nodeID === this.rootID) {
            throw new Error('Root cannot be deleted.');
        }
        var subTreeDict = {};
        var currentNode = this.nodes[nodeID];
        if (!currentNode) {
            throw new Error('Node doesnt exist');
        }
        var parentID = currentNode['parentID'];
        var childIndex = this.nodes[parentID].children.indexOf(currentNode['id']);
        this.nodes[parentID].children.splice(childIndex, 1);
        var subTreeIDs = this.getSubtreeIDs(currentNode['id']);
        subTreeIDs.forEach(function (id) {
            subTreeDict[id] = __assign({}, _this.nodes[id]);
            delete _this.nodes[id];
        });
        var tree = this.createNewTree(currentNode['id'], subTreeDict);
        return tree;
        // throw new Error('Method not implemented.');
        // returns the subTree..
    };
    Tree.prototype.getSubtreeIDs = function (nodeID) {
        var _this = this;
        var currNode = this.nodes[nodeID];
        var IDs = [];
        IDs.push(currNode['id']);
        currNode.children.forEach(function (child) {
            var subTreeIDs = _this.getSubtreeIDs(child);
            IDs = IDs.concat(subTreeIDs);
        });
        return IDs;
    };
    Tree.prototype.getSubtreeByID = function (nodeID) {
        var _this = this;
        //creates a new Tree,
        //clones the subtree from the tree
        // returns the subTree..
        var subTreeDict = {};
        var currentNode = this.nodes[nodeID];
        var subTreeIDs = this.getSubtreeIDs(currentNode['id']);
        subTreeIDs.forEach(function (id) {
            subTreeDict['id'] = _this.nodes[id];
        });
        var tree = new Tree(subTreeDict[currentNode['id']], '');
        return tree;
    };
    Tree.prototype.getTree = function () {
        return {
            rootID: this.rootID,
            nodes: this.nodes,
            treeID: this.treeID,
        };
    };
    return Tree;
}());
exports.Tree = Tree;
function CreateTree(tree) {
    var newTree = new Tree(tree.nodes[tree.rootID], tree.treeID);
    newTree.nodes = tree.nodes;
    return newTree;
}
exports.CreateTree = CreateTree;
