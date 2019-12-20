import { GC, LogLevels } from "../global-config";

// @ts-ignore
const ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;

// @ts-ignore
const log: { (s: any): void } = global.log;

interface Loggable {
  publishLog(logLevel: LogLevels, ...message: any[]): void;
}

/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
export function Logger(): Loggable {
  // pass the loglevel and the message: any type is allowed
  // @ts-ignore - bad Clark
  const messaging = ClearBlade.Messaging();
  function publishLog(logLevel: LogLevels, ...messages: any[]) {
    let pubMsg = " ";
    if (messages.length > 0) {
      pubMsg = `${messages
        .map(a => (typeof a === "object" ? JSON.stringify(a) : a))
        .join(" ")}`;
    }

    switch (logLevel) {
      case GC.LOG_LEVEL.INFO:
        if (
          GC.LOG_SETTING === GC.LOG_LEVEL.INFO ||
          GC.LOG_SETTING === GC.LOG_LEVEL.DEBUG
        ) {
          messaging.publish(GC.LOG_LEVEL.INFO, pubMsg);
        }
        break;
      case GC.LOG_LEVEL.DEBUG:
        if (GC.LOG_SETTING === GC.LOG_LEVEL.DEBUG) {
          messaging.publish(GC.LOG_LEVEL.DEBUG, pubMsg);
        }
        break;
      default:
        messaging.publish(logLevel, pubMsg);
        break;
    }
  }

  function prettyLog(...args: any[]) {
    if (args.length > 0) {
      return `${args
        .map(a => (typeof a === "object" ? JSON.stringify(a) : a))
        .join(" ")}`;
    }
    return "";
  }

  return {
    publishLog
  };
}
