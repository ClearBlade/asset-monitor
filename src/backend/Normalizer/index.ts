import { Logger } from "../logger";
import { GC } from "../global-config";
import { Assets } from "../collection-schema/assets";
import "../../static/promise-polyfill/index.js";
// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;
// @ts-ignore
var log: { (s: any): void } = global.log;
export type MessageParser = (
  err: boolean,
  msg: any,
  topic: string
) => Promise<Array<Assets>>; // parses message and returns normalized format

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

interface IKeysToPublish extends Array<string> {}

export interface PublishConfig {
  topicFn: (assetID: string) => string;
  keysToPublish: IKeysToPublish;
}

export const api = {
  default: normalizer,
  publisher
};
export function normalizer(config: NormalizerConfig) {
  let resp = config.resp;
  let req = config.req;
  let messageParser = config.messageParser;
  let topics = config.topics;
  let publishConfig = config.normalizerPubConfig || GC.NORMALIZER_PUB_CONFIG;

  const TOPIC = topics[0];
  // @ts-ignore - bad Clark
  const SERVICE_INSTANCE_ID = req.service_instance_id;
  // @ts-ignore - bad Clark
  let messaging = ClearBlade.Messaging();
  var logger = Logger();

  logger.publishLog(
    GC.LOG_LEVEL.DEBUG,
    "Normalizer SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID
  );

  let subscribePromises = [];
  for (let i = 0, l = topics.length; i < l; i++) {
    subscribePromises.push(subscriber(topics[i]));
  }

  Promise.all(subscribePromises)
    .then(WaitLoop)
    .catch(failureCb);

  //@ts-ignore
  Promise.runQueue();

  function WaitLoop() {
    logger.publishLog(
      GC.LOG_LEVEL.SUCCESS,
      SERVICE_INSTANCE_ID,
      ": Subscribed to Shared Topic. Starting Loop."
    );

    while (true) {
      // @ts-ignore - bad Clark
      messaging.waitForMessage([TOPIC], HandleMessage);
    }
  }

  function HandleMessage(err: boolean, msg: string, topic: string) {
    if (err) {
      resp.error(
        `HandleMessage error inside Normalizer. Service was probably killed while waiting for messages. ${JSON.stringify(
          { err, msg, topic }
        )}`
      );
    }
    //promisifying
    messageParser(err, msg, topic)
      .then(function(assets) {
        bulkPublisher(assets, publishConfig);
      })
      .catch(failureCb);
    // @ts-ignore
    Promise.runQueue();
    //maybe TODO: give a callback
  }

  function failureCb(reason: any) {
    logger.publishLog(
      GC.LOG_LEVEL.ERROR,
      SERVICE_INSTANCE_ID,
      ": Failed ",
      reason
    );
  }
}

export function subscriber(topic: string): Promise<unknown> {
  // @ts-ignore - bad Clark
  let messaging = ClearBlade.Messaging();
  var promise = new Promise(function(resolve, reject) {
    // @ts-ignore - bad Clark
    messaging.subscribe(topic, function(err, data) {
      if (err) {
        reject("Error with subscribing" + data);
      } else {
        resolve(data);
      }
    });
  });
  return promise;
}

export function bulkPublisher(
  assets: Array<Assets>,
  normalizerPubConfig: NormalizerPublishConfig = GC.NORMALIZER_PUB_CONFIG
) {
  Object.keys(normalizerPubConfig).forEach(function(key) {
    publisher(assets, normalizerPubConfig[key]);
  });
}

export function publisher(assets: Array<Assets>, pubConfig: PublishConfig) {
  // @ts-ignore - bad Clark
  let messaging = ClearBlade.Messaging();
  for (let i = 0, l = assets.length; i < l; i++) {
    const assetID = assets[i]["id"];
    //@ts-ignore
    const topic = pubConfig.topicFn(assetID);
    let pubData = {};
    pubConfig.keysToPublish.forEach(function(value) {
      //@ts-ignore
      pubData[value] = assets[i][value];
    });
    messaging.publish(topic, JSON.stringify(pubData));
  }
}
