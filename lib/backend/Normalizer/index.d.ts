import { LogLevels } from '../global-config';
import { Asset } from '../collection-schema/Assets';
import '../../static/promise-polyfill/index.js';
export declare type MessageParser = (err: boolean, msg: string, topic: string) => Promise<Array<Asset>>;
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
declare type IKeysToPublish = Array<string>;
export interface PublishConfig {
    topicFn: (assetID: string) => string;
    keysToPublish: IKeysToPublish;
    shouldPublishAsset?: (asset: Asset) => boolean;
}
export declare function subscriber(topic: string): Promise<unknown>;
export declare function bulkSubscriber(topics: string[]): Promise<unknown>;
export declare function publisher(assets: Array<Asset>, pubConfig: PublishConfig): void;
export declare function bulkPublisher(assets: Array<Asset>, normalizerPubConfig?: NormalizerPublishConfig): void;
export declare function normalizer(config: NormalizerConfig): void;
export declare const api: {
    default: typeof normalizer;
    publisher: typeof publisher;
};
export {};
