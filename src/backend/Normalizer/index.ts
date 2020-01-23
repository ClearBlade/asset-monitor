import { Logger } from '../Logger';
import { GC, LogLevels } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import '../../static/promise-polyfill/index.js';

export type MessageParser = (err: boolean, msg: string, topic: string) => Promise<Array<Asset>>;
// parses message and returns normalized format

export interface NormalizerPublishConfig {
    [key: string]: PublishConfig;
}

interface NormalizerConfig {
    normalizerPubConfig: NormalizerPublishConfig;
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    messageParser: MessageParser;
    topics: Array<string>;
}

type IKeysToPublish = Array<string>;

export interface PublishConfig {
    topicFn: (assetID: string) => string;
    keysToPublish: IKeysToPublish;
    shouldPublishAsset?: (asset: Asset) => boolean;
}

export function subscriber(topic: string): Promise<unknown> {
    const messaging = ClearBlade.Messaging();
    const promise = new Promise(function(resolve, reject) {
        messaging.subscribe(topic, function(err, data) {
            if (err) {
                reject('Error with subscribing' + JSON.stringify(data));
            } else {
                resolve(data);
            }
        });
    });
    return promise;
}

export function publisher(assets: Array<Asset>, pubConfig: PublishConfig): void {
    const messaging = ClearBlade.Messaging();
    for (let i = 0, l = assets.length; i < l; i++) {
        const assetID = assets[i].id;
        const topic = pubConfig.topicFn(assetID as string);
        const pubData: Asset = {};
        pubConfig.keysToPublish.forEach(function(value) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            pubData[value] = assets[i][value];
        });

        if (typeof pubConfig.shouldPublishAsset === 'undefined' || pubConfig.shouldPublishAsset(pubData)) {
            messaging.publish(topic, JSON.stringify(pubData));
        }
    }
}

export function bulkPublisher(
    assets: Array<Asset>,
    normalizerPubConfig: NormalizerPublishConfig = GC.NORMALIZER_PUB_CONFIG,
): void {
    Object.keys(normalizerPubConfig).forEach(function(key) {
        publisher(assets, normalizerPubConfig[key]);
    });
}

export function normalizer(config: NormalizerConfig): void {
    const messageParser = config.messageParser;
    const publishConfig = config.normalizerPubConfig || GC.NORMALIZER_PUB_CONFIG;

    const TOPIC = config.topics[0];
    const SERVICE_INSTANCE_ID = config.req.service_instance_id;
    const messaging = ClearBlade.Messaging();
    const logger = Logger({ name: 'Normalizer' });

    logger.publishLog(LogLevels.DEBUG, 'Normalizer SERVICE_INSTANCE_ID:: ' + SERVICE_INSTANCE_ID);

    const subscribePromises: Promise<unknown>[] = [];
    for (let i = 0, l = config.topics.length; i < l; i++) {
        subscribePromises.push(subscriber(config.topics[i]));
    }

    function failureCb(reason: unknown): void {
        logger.publishLog(LogLevels.ERROR, SERVICE_INSTANCE_ID, ': Failed ', JSON.stringify(reason));
    }

    function HandleMessage(err: boolean, msg: string, topic: string): void {
        if (err) {
            config.resp.error(
                `HandleMessage error inside Normalizer. Service was probably killed while waiting for messages. ${JSON.stringify(
                    { err, msg, topic },
                )}`,
            );
        }
        //promisifying
        messageParser(err, msg, topic)
            .then(function(assets) {
                bulkPublisher(assets, publishConfig);
            })
            .catch(failureCb);
        Promise.runQueue();
        //maybe TODO: give a callback
    }

    function WaitLoop(): void {
        logger.publishLog(LogLevels.SUCCESS, SERVICE_INSTANCE_ID, ': Subscribed to Shared Topics. Starting Loop.');
        // eslint-disable-next-line no-constant-condition
        while (true) {
            messaging.waitForMessage([TOPIC], HandleMessage);
        }
    }

    Promise.all(subscribePromises)
        .then(WaitLoop)
        .catch(failureCb);

    Promise.runQueue();
}

export const api = {
    default: normalizer,
    publisher,
};
