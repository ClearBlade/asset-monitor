import { GC, LogLevels } from '../global-config';

export function prettyLog(...args: unknown[]): string {
    if (args.length > 0) {
        return `${args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ')}`;
    }
    return '';
}

export function createPrettyLogWithName(config: { name: string }, ...messages: unknown[]): string {
    return prettyLog(config.name, ...messages);
}

interface Loggable {
    publishLog(logLevel: LogLevels, ...message: unknown[]): void;
}

interface LoggerConfig {
    name: string;
    logSetting?: LogLevels;
}

const defaultConfig: LoggerConfig = {
    name: 'NameNotSet',
    logSetting: GC.LOG_SETTING,
};

/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
// export function Logger({ name = defaultConfig.name, logSetting = defaultConfig.logSetting } = defaultConfig): Loggable {
//     // pass the loglevel and the message: any type is allowed
//     const messaging = ClearBlade.Messaging();
// function publishLog(logLevel: LogLevels, ...messages: unknown[]): void {
//     const pubMsg = createPrettyLogWithName({ name }, messages);
//     switch (logLevel) {
//         case GC.LOG_LEVEL.INFO:
//             if (logSetting === GC.LOG_LEVEL.INFO || logSetting === GC.LOG_LEVEL.DEBUG) {
//                 messaging.publish(GC.LOG_LEVEL.INFO, pubMsg);
//             }
//             break;
//         case GC.LOG_LEVEL.DEBUG:
//             if (logSetting === GC.LOG_LEVEL.DEBUG) {
//                 messaging.publish(GC.LOG_LEVEL.DEBUG, pubMsg);
//             }
//             break;
//         default:
//             messaging.publish(logLevel, pubMsg);
//             break;
//     }
// }

//     return {
//         publishLog,
//     };
// }

export class Logger {
    private name: string;
    private logSetting: LogLevels | undefined;
    private readonly levels: { [key: string]: number } = {
        success: 1,
        debug: 2,
        info: 3,
        warn: 4,
        error: 5,
        fatal: 6,
    };

    constructor({ name = defaultConfig.name, logSetting = defaultConfig.logSetting }: LoggerConfig = defaultConfig) {
        this.name = name;
        this.logSetting = logSetting;
    }

    /**
     * Converts a string level (trace/debug/info/warn/error) into a number
     *
     * @param minLevel
     */
    private levelToInt(minLevel: string): number {
        if (minLevel.toLowerCase() in this.levels) return this.levels[minLevel.toLowerCase()];
        else return 99;
    }

    public publishLog(logLevel: LogLevels, ...messages: unknown[]): void {
        const messaging = ClearBlade.Messaging();
        const pubMsg = createPrettyLogWithName({ name: this.name }, messages);
        const level = this.levelToInt(logLevel);
        const minLevel = this.levelToInt(this.logSetting || '');

        if (level < minLevel) return;

        messaging.publish(logLevel, pubMsg);
    }
}
