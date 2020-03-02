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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var edge_message_relay_1 = require("@clearblade/one-way-sync/edge/edge-message-relay");
var Util_1 = require("../../Util");
exports.default = (function (_a) {
    var edgeShouldRelayAssetHistory = _a.edgeShouldRelayAssetHistory, edgeShouldRelayAssetStatus = _a.edgeShouldRelayAssetStatus, edgeShouldRelayLocation = _a.edgeShouldRelayLocation, edgeShouldRelayRules = _a.edgeShouldRelayRules, _b = _a.topics, topics = _b === void 0 ? [] : _b, rest = __rest(_a, ["edgeShouldRelayAssetHistory", "edgeShouldRelayAssetStatus", "edgeShouldRelayLocation", "edgeShouldRelayRules", "topics"]);
    var theTopics = __spreadArrays(topics);
    if (edgeShouldRelayLocation) {
        theTopics.push('$share/EdgeRelayGroup/' + Util_1.Topics.DBUpdateAssetLocation('+'));
    }
    if (edgeShouldRelayAssetStatus) {
        theTopics.push('$share/EdgeRelayGroup/' + Util_1.Topics.DBUpdateAssetStatus('+'));
    }
    if (edgeShouldRelayAssetHistory) {
        theTopics.push('$share/EdgeRelayGroup/' + Util_1.Topics.AssetHistory('+'));
    }
    if (edgeShouldRelayRules) {
        theTopics.push('$share/EdgeRelayGroup/' + '_rules/_monitor/_asset/+');
    }
    return edge_message_relay_1.default(__assign(__assign({}, rest), { topics: theTopics, getRelayTopicSuffix: function (topic) {
            var assetId = Util_1.getAssetIdFromTopic(topic);
            switch (topic) {
                case "$share/EdgeRelayGroup/" + Util_1.Topics.DBUpdateAssetLocation(assetId):
                    if (edgeShouldRelayLocation) {
                        return Util_1.Topics.DBUpdateAssetLocation(assetId);
                    }
                    break;
                case "$share/EdgeRelayGroup/" + Util_1.Topics.DBUpdateAssetStatus(assetId):
                    if (edgeShouldRelayAssetStatus) {
                        return Util_1.Topics.DBUpdateAssetStatus(assetId);
                    }
                    break;
                case "$share/EdgeRelayGroup/" + Util_1.Topics.AssetHistory(assetId):
                    if (edgeShouldRelayAssetHistory) {
                        return Util_1.Topics.AssetHistory(assetId);
                    }
                    break;
                case "$share/EdgeRelayGroup/_rules/_monitor/_asset/" + assetId:
                    if (edgeShouldRelayAssetHistory) {
                        return '_rules/_monitor/_asset/' + assetId;
                    }
                    break;
                default:
                    return topic;
            }
        } }));
});
