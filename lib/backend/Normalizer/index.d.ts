/// <reference types="clearbladejs-server" />
import { Assets } from "../collection-schema/assets";
import "../../static/promise-polyfill/index.js";
export declare type MessageParser = (err: boolean, msg: any, topic: string) => Promise<Array<Assets>>;
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
interface IKeysToPublish extends Array<string> {
}
export interface PublishConfig {
    topicFn: (assetID: string) => string;
    keysToPublish: IKeysToPublish;
}
export declare const api: {
    default: typeof normalizer;
    publisher: typeof publisher;
};
export declare function normalizer(config: NormalizerConfig): void;
export declare function subscriber(topic: string): Promise<unknown>;
export declare function bulkPublisher(assets: Array<Assets>, normalizerPubConfig?: NormalizerPublishConfig): void;
export declare function publisher(assets: Array<Assets>, pubConfig: PublishConfig): void;
export {};
