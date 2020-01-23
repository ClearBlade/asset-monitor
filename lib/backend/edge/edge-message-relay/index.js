"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../static/promise-polyfill/index.js");
var Normalizer_1 = require("../../Normalizer");
var Util_1 = require("../../Util");
var shared_1 = require("../shared");
function edgeMessageRelay(_a) {
    var req = _a.req, resp = _a.resp, edgeShouldRelayLocation = _a.edgeShouldRelayLocation, edgeShouldRelayAssetStatus = _a.edgeShouldRelayAssetStatus, edgeShouldRelayAssetHistory = _a.edgeShouldRelayAssetHistory, edgeShouldRelayRules = _a.edgeShouldRelayRules, _b = _a.cacheName, cacheName = _b === void 0 ? shared_1.DEFAULT_EDGE_RELAY_CACHE_NAME : _b, _c = _a.collectionName, collectionName = _c === void 0 ? shared_1.DEFAULT_EDGE_RELAY_CACHE_COLLECTION_NAME : _c;
    //We don't want this service to run on the platform
    if (!ClearBlade.isEdge) {
        resp.success('Execution environment is not ClearBlade Edge, exiting.');
    }
    log('edgeMessageRelay - Starting service instance');
    ClearBlade.init({ request: req });
    var messaging = ClearBlade.Messaging();
    var cache = ClearBlade.Cache(cacheName);
    var intervalTopic = 'interval/edgeMessageRelay';
    var intervalID;
    var CACHE_ITEM_NAME = 'edgeIsConnected';
    var CACHE_TTL_INTERVAL = 1800; //seconds
    var TOPICS = [intervalTopic];
    var subscribePromises = [];
    //Add topics to array - These are the topics the normalizer publishes to internally
    //TODO - We should probably grab these topics from Global Config instead
    //
    //Location update - Topics.DBUpdateAssetLocation
    //Asset status update - Topics.DBUpdateAssetLocation
    //Asset history update - Topics.AssetHistory
    if (edgeShouldRelayLocation) {
        log('edgeMessageRelay - Edge will relay location data to platform.');
        TOPICS.push('$share/EdgeRelayGroup/' + Util_1.Topics.DBUpdateAssetLocation('+'));
    }
    if (edgeShouldRelayAssetStatus) {
        log('edgeMessageRelay - Edge will relay asset status data to platform.');
        TOPICS.push('$share/EdgeRelayGroup/' + Util_1.Topics.DBUpdateAssetStatus('+'));
    }
    if (edgeShouldRelayAssetHistory) {
        log('edgeMessageRelay - Edge will relay asset history data to platform.');
        TOPICS.push('$share/EdgeRelayGroup/' + Util_1.Topics.AssetHistory('+'));
    }
    if (edgeShouldRelayRules) {
        log('edgeMessageRelay - Edge will relay rules data to platform.');
        TOPICS.push('$share/EdgeRelayGroup/' + '_rules/_monitor/_asset/+');
    }
    if (TOPICS.length <= 1) {
        log('edgeMessageRelay - No topics to subscribe to.');
        resp.error('No topics to subscribe to.');
        return;
    }
    TOPICS.forEach(function (topic) {
        log('edgeMessageRelay - Subscribing to topic ' + topic);
        subscribePromises.push(Normalizer_1.subscriber(topic));
    });
    function WaitLoop() {
        messaging.setInterval(CACHE_TTL_INTERVAL * 1000, intervalTopic, '', -1, function (err, data) {
            if (err) {
                log('edgeMessageRelay - Error invoking setInterval: ' + JSON.stringify(data));
                resp.error('Error invoking setInterval: ' + JSON.stringify(data));
                return;
            }
            intervalID = data;
            log('edgeMessageRelay - Subscribed to Shared Topics. Starting Loop.');
            // eslint-disable-next-line no-constant-condition
            while (true) {
                log('edgeMessageRelay - Waiting for new messages');
                messaging.waitForMessage(TOPICS, function (err, msg, topic) {
                    if (err) {
                        cancelInterval();
                        log('edgeMessageRelay - Failed to wait for message: ' + err + ' ' + msg + '  ' + topic);
                        resp.error('Failed to wait for message: ' + err + ' ' + msg + '    ' + topic);
                        return;
                    }
                    log('edgeMessageRelay - Message received on topic ' + topic);
                    processMessage(msg, topic);
                });
            }
        });
    }
    function processMessage(msg, topic) {
        //Determine the topic that was received
        var assetId = Util_1.getAssetIdFromTopic(topic);
        log('edgeMessageRelay - assetId = ' + assetId);
        switch (topic) {
            case intervalTopic:
                //Refresh the cache by reading the current value and writing it back
                refreshSharedCacheItem(CACHE_ITEM_NAME);
                break;
            default:
                if (topic === '$share/EdgeRelayGroup/' + Util_1.Topics.DBUpdateAssetLocation(assetId)) {
                    log('edgeMessageRelay - Asset location message received');
                    if (edgeShouldRelayLocation) {
                        log('edgeMessageRelay - Relaying location data to platform.');
                        relayMessage(msg, Util_1.Topics.DBUpdateAssetLocation(assetId));
                    }
                }
                else {
                    if (topic === '$share/EdgeRelayGroup/' + Util_1.Topics.DBUpdateAssetStatus(assetId)) {
                        log('edgeMessageRelay - Asset status message received');
                        if (edgeShouldRelayAssetStatus) {
                            log('edgeMessageRelay - Relaying asset status data to platform.');
                            relayMessage(msg, Util_1.Topics.DBUpdateAssetStatus(assetId));
                        }
                    }
                    else {
                        if (topic === '$share/EdgeRelayGroup/' + Util_1.Topics.AssetHistory(assetId)) {
                            log('edgeMessageRelay - Asset history message received');
                            if (edgeShouldRelayAssetHistory) {
                                log('edgeMessageRelay - Relaying asset history data to platform.');
                                relayMessage(msg, Util_1.Topics.AssetHistory(assetId));
                            }
                        }
                        else {
                            if (topic === '$share/EdgeRelayGroup/_rules/_monitor/_asset/' + assetId) {
                                log('edgeMessageRelay - Rules message received');
                                if (edgeShouldRelayAssetHistory) {
                                    log('edgeMessageRelay - Relaying rules data to platform.');
                                    relayMessage(msg, '_rules/_monitor/_asset/' + assetId);
                                }
                            }
                            else {
                                log('edgeMessageRelay - Unknown topic received: ' + topic);
                            }
                        }
                    }
                }
        }
    }
    function getSharedCacheItem(itemName, callback) {
        cache.get(itemName, function (err, data) {
            callback(err, data);
        });
    }
    function setSharedCacheItem(itemName, itemValue) {
        cache.set(itemName, itemValue, function (err, data) {
            if (err) {
                log('Error updating shared cache: ' + JSON.stringify(data));
            }
            else {
                log('Shared cache updated: edgeIsConnected = true');
            }
        });
    }
    function refreshSharedCacheItem(itemName) {
        getSharedCacheItem(itemName, function (err, data) {
            if (err) {
                log('Error retrieving from shared cache: ' + JSON.stringify(data));
            }
            else {
                setSharedCacheItem(itemName, data);
            }
        });
    }
    function relayMessage(msg, topic) {
        cache.get('edgeIsConnected', function (err, data) {
            if (err) {
                log('edgeMessageRelay - Error retrieving edgeIsConnected from shared cache:' + JSON.stringify(data));
                addMessageToRelayCache(msg, topic);
            }
            else {
                log('edgeMessageRelay - edgeIsConnected retrieved from shared cache: ' + JSON.stringify(data));
                var isConnected = JSON.parse(data);
                if (isConnected) {
                    log('edgeMessageRelay - Publishing message to topic ' + topic);
                    messaging.publish(topic + '/_platform', msg);
                }
                else {
                    log('edgeMessageRelay - Adding message to relay cache');
                    addMessageToRelayCache(msg, topic);
                }
            }
        });
    }
    function addMessageToRelayCache(msg, topic) {
        log('edgeMessageRelay - Adding message to edge_relay_cache data collection');
        var col = ClearBlade.Collection({ collectionName: collectionName });
        var newRow = {
            topic: topic,
            payload: msg,
            timestamp: new Date().toISOString(),
        };
        col.create(newRow, function (err, res) {
            if (err) {
                log('edgeMessageRelay - Error creating row in edge_relay_cache: ' + JSON.stringify(res));
            }
            else {
                log('edgeMessageRelay - Row created in edge_relay_cache');
            }
        });
    }
    function cancelInterval() {
        messaging.cancelCBInterval(intervalID, function (err, data) {
            if (err) {
                log('Error cancelling interval: ' + JSON.stringify(data));
                resp.error('Error invoking cancelCBInterval: ' + JSON.stringify(data));
            }
            log('Interval cancelled, exiting...');
            resp.success('Interval canceled: ' + JSON.stringify(data));
        });
    }
    Promise.all(subscribePromises)
        .then(WaitLoop)
        .catch(function (err) {
        log('edgeMessageRelay - Error subscribing to topic: ' + JSON.stringify(err));
        resp.error('Error subscribing to topic: ' + err.message);
    });
    Promise.runQueue();
}
exports.default = edgeMessageRelay;
