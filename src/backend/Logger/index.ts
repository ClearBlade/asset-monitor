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

interface LoggerConfig {
    name: string;
    logSetting?: LogLevels;
}

const defaultConfig: LoggerConfig = {
    name: 'NameNotSet',
    logSetting: GC.LOG_SETTING,
};
export class Logger {
    private name: string;
    private logSetting: LogLevels | undefined;
    private readonly levels: { [key: string]: number } = {
        trace: 1,
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
