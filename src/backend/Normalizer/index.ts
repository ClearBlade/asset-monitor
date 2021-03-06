import { Logger } from '../Logger';
import { GC, LogLevels } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import { getErrorMessage, Topics } from '../Util';
import { subscriber, bulkSubscriber } from '@clearblade/messaging-utils';
import '@clearblade/promise-polyfill';

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
    logSetting?: LogLevels;
    logServiceName?: string;
}

type IKeysToPublish = Array<string>;

export interface PublishConfig {
    topicFn: (assetID: string) => string;
    keysToPublish: IKeysToPublish;
    shouldPublishAsset?: (asset: Asset) => boolean;
}

export function publisher(assets: Array<Asset>, pubConfig: PublishConfig): void {
    const messaging = ClearBlade.Messaging();
    for (let i = 0, l = assets.length; i < l; i++) {
        const assetID = assets[i].id;
        const topic = pubConfig.topicFn(assetID as string);
        const pubData: Record<string, unknown> = {};
        pubConfig.keysToPublish.forEach(function(value) {
            pubData[value as keyof Asset] = assets[i][value as keyof Asset];
        });

        if (typeof pubConfig.shouldPublishAsset === 'undefined' || pubConfig.shouldPublishAsset(pubData)) {
            messaging.publish(topic, JSON.stringify(pubData));
        }
    }
}

export { subscriber, bulkSubscriber };

export function bulkPublisher(
    assets: Array<Asset>,
    normalizerPubConfig: NormalizerPublishConfig = GC.NORMALIZER_PUB_CONFIG,
): void {
    Object.keys(normalizerPubConfig).forEach(function(key) {
        publisher(assets, normalizerPubConfig[key]);
    });
}

/*
publishExternalEvent is a utility function for publishing external events to the rules topic with the correct format
*/
export function publishExternalEvent(
    asset: Asset,
    ruleId: string,
    timestamp?: string,
    ruleTopicFn: typeof Topics.RulesAssetLocation = Topics.RulesAssetLocation,
): void {
    ClearBlade.Messaging().publish(
        ruleTopicFn(asset.id as string),
        JSON.stringify({ ...asset, meta: { rule_id: ruleId, is_external_rule_type: true, timestamp } }),
    );
}

export function normalizer(config: NormalizerConfig): void {
    const messageParser = config.messageParser;
    const publishConfig = config.normalizerPubConfig || GC.NORMALIZER_PUB_CONFIG;
    const logServiceName = config.logServiceName || 'Normalizer';
    const logSetting = config.logSetting || LogLevels.DEBUG;
    const TOPIC = config.topics[0];
    const SERVICE_INSTANCE_ID = config.req.service_instance_id;
    const messaging = ClearBlade.Messaging();
    const logger = new Logger({ name: logServiceName, logSetting });

    logger.publishLog(LogLevels.DEBUG, 'Normalizer SERVICE_INSTANCE_ID:: ' + SERVICE_INSTANCE_ID);

    const subscribePromises: Promise<unknown>[] = [];
    for (let i = 0, l = config.topics.length; i < l; i++) {
        subscribePromises.push(subscriber(config.topics[i]));
    }

    function failureCb(error: Error | string): void {
        logger.publishLog(LogLevels.ERROR, 'Failed ', getErrorMessage(error));
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
        logger.publishLog(LogLevels.INFO, 'Subscribed to Shared Topics. Starting Loop.');
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

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
global.normalizer = normalizer;
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
global.publishExternalEvent = publishExternalEvent;

export const api = {
    default: normalizer,
    publisher,
};
