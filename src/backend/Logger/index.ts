import { GC, LogLevels } from '../global-config';

const ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;

interface Loggable {
    publishLog(logLevel: LogLevels, ...message: unknown[]): void;
}

/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
export function Logger(): Loggable {
    // pass the loglevel and the message: any type is allowed
    const messaging = ClearBlade.Messaging();
    function publishLog(logLevel: LogLevels, ...messages: unknown[]): void {
        let pubMsg = ' ';
        if (messages.length > 0) {
            pubMsg = `${messages.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')}`;
        }

        switch (logLevel) {
            case GC.LOG_LEVEL.INFO:
                if (GC.LOG_SETTING === GC.LOG_LEVEL.INFO || GC.LOG_SETTING === GC.LOG_LEVEL.DEBUG) {
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

    return {
        publishLog,
    };
}

export function prettyLog(...args: unknown[]): string {
    if (args.length > 0) {
        return `${args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')}`;
    }
    return '';
}
