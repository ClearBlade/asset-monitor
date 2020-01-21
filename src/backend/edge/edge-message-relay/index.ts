import '../static/promise-polyfill/index.js';
import { subscriber } from '../../Normalizer';
import { Topics, getAssetIdFromTopic } from '../../Util';
import { DEFAULT_EDGE_RELAY_CACHE_NAME, DEFAULT_EDGE_RELAY_CACHE_COLLECTION_NAME } from '../shared';

interface EdgeMessageRelayConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    edgeShouldRelayLocation: boolean;
    edgeShouldRelayAssetStatus: boolean;
    edgeShouldRelayAssetHistory: boolean;
    edgeShouldRelayRules: boolean;
    cacheName?: string;
    collectionName?: string;
}

function edgeMessageRelay({
    req,
    resp,
    edgeShouldRelayLocation,
    edgeShouldRelayAssetStatus,
    edgeShouldRelayAssetHistory,
    edgeShouldRelayRules,
    cacheName = DEFAULT_EDGE_RELAY_CACHE_NAME,
    collectionName = DEFAULT_EDGE_RELAY_CACHE_COLLECTION_NAME,
}: EdgeMessageRelayConfig): void {
    //We don't want this service to run on the platform
    if (!ClearBlade.isEdge) {
        resp.success('Execution environment is not ClearBlade Edge, exiting.');
    }

    log('edgeMessageRelay - Starting service instance');

    ClearBlade.init({ request: req });
    const messaging = ClearBlade.Messaging();

    const cache = ClearBlade.Cache(cacheName);

    const intervalTopic = 'interval/edgeMessageRelay';
    let intervalID: string;
    const CACHE_TTL_INTERVAL = 1800; //seconds

    const TOPICS = [intervalTopic];
    const subscribePromises: Promise<unknown>[] = [];

    //Add topics to array - These are the topics the normalizer publishes to internally
    //TODO - We should probably grab these topics from Global Config instead
    //
    //Location update - Topics.DBUpdateAssetLocation
    //Asset status update - Topics.DBUpdateAssetLocation
    //Asset history update - Topics.AssetHistory
    if (edgeShouldRelayLocation) {
        log('edgeMessageRelay - Edge will relay location data to platform.');
        TOPICS.push('$share/EdgeRelayGroup/' + Topics.DBUpdateAssetLocation('+'));
    }
    if (edgeShouldRelayAssetStatus) {
        log('edgeMessageRelay - Edge will relay asset status data to platform.');
        TOPICS.push('$share/EdgeRelayGroup/' + Topics.DBUpdateAssetStatus('+'));
    }
    if (edgeShouldRelayAssetHistory) {
        log('edgeMessageRelay - Edge will relay asset history data to platform.');
        TOPICS.push('$share/EdgeRelayGroup/' + Topics.AssetHistory('+'));
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

    TOPICS.forEach(topic => {
        log('edgeMessageRelay - Subscribing to topic ' + topic);
        subscribePromises.push(subscriber(topic));
    });

    function WaitLoop(): void {
        messaging.setInterval(CACHE_TTL_INTERVAL * 1000, intervalTopic, '', -1, function(err, data) {
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

                messaging.waitForMessage(TOPICS, function(err, msg, topic) {
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

    function processMessage(msg: string, topic: string): void {
        //Determine the topic that was received
        const assetId = getAssetIdFromTopic(topic);
        log('edgeMessageRelay - assetId = ' + assetId);

        switch (topic) {
            case intervalTopic:
                //Refresh the cache TTL by setting a dummy value
                cache.set('ttlRefresh', false, (err, data) => {
                    if (err) {
                        log('edgeMessageRelay - Error updating ttlRefresh in shared cache:' + JSON.stringify(data));
                    } else {
                        log('edgeMessageRelay - Shared cache ttlRefresh updated.');
                    }
                });
                break;
            default:
                if (topic === '$share/EdgeRelayGroup/' + Topics.DBUpdateAssetLocation(assetId)) {
                    log('edgeMessageRelay - Asset location message received');
                    if (edgeShouldRelayLocation) {
                        log('edgeMessageRelay - Relaying location data to platform.');
                        relayMessage(msg, Topics.DBUpdateAssetLocation(assetId));
                    }
                } else {
                    if (topic === '$share/EdgeRelayGroup/' + Topics.DBUpdateAssetStatus(assetId)) {
                        log('edgeMessageRelay - Asset status message received');
                        if (edgeShouldRelayAssetStatus) {
                            log('edgeMessageRelay - Relaying asset status data to platform.');
                            relayMessage(msg, Topics.DBUpdateAssetStatus(assetId));
                        }
                    } else {
                        if (topic === '$share/EdgeRelayGroup/' + Topics.AssetHistory(assetId)) {
                            log('edgeMessageRelay - Asset history message received');
                            if (edgeShouldRelayAssetHistory) {
                                log('edgeMessageRelay - Relaying asset history data to platform.');
                                relayMessage(msg, Topics.AssetHistory(assetId));
                            }
                        } else {
                            if (topic === '$share/EdgeRelayGroup/_rules/_monitor/_asset/' + assetId) {
                                log('edgeMessageRelay - Rules message received');
                                if (edgeShouldRelayAssetHistory) {
                                    log('edgeMessageRelay - Relaying rules data to platform.');
                                    relayMessage(msg, '_rules/_monitor/_asset/' + assetId);
                                }
                            } else {
                                log('edgeMessageRelay - Unknown topic received: ' + topic);
                            }
                        }
                    }
                }
        }
    }

    function relayMessage(msg: string, topic: string): void {
        cache.get('edgeIsConnected', (err, data) => {
            if (err) {
                log('edgeMessageRelay - Error retrieving edgeIsConnected from shared cache:' + JSON.stringify(data));
                addMessageToRelayCache(msg, topic);
            } else {
                log('edgeMessageRelay - edgeIsConnected retrieved from shared cache: ' + JSON.stringify(data));
                const isConnected = JSON.parse(data as string);
                if (isConnected) {
                    log('edgeMessageRelay - Publishing message to topic ' + topic);
                    messaging.publish(topic + '/_platform', msg);
                } else {
                    log('edgeMessageRelay - Adding message to relay cache');
                    addMessageToRelayCache(msg, topic);
                }
            }
        });
    }

    function addMessageToRelayCache(msg: string, topic: string): void {
        log('edgeMessageRelay - Adding message to edge_relay_cache data collection');

        const col = ClearBlade.Collection({ collectionName });
        const newRow = {
            topic: topic,
            payload: msg,
            timestamp: new Date().toISOString(),
        };

        col.create(newRow, function(err, res) {
            if (err) {
                log('edgeMessageRelay - Error creating row in edge_relay_cache: ' + JSON.stringify(res));
            } else {
                log('edgeMessageRelay - Row created in edge_relay_cache');
            }
        });
    }

    function cancelInterval(): void {
        messaging.cancelCBInterval(intervalID, function(err, data) {
            if (err) {
                log('edgeMessageRelay - Error cancelling interval: ' + JSON.stringify(data));
            }
        });
    }

    Promise.all(subscribePromises)
        .then(WaitLoop)
        .catch(err => {
            log('edgeMessageRelay - Error subscribing to topic: ' + JSON.stringify(err));
            resp.error('Error subscribing to topic: ' + err.message);
        });

    Promise.runQueue();
}

export default edgeMessageRelay;
