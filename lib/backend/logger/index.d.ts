import { LogLevels } from '../global-config';
export declare function prettyLog(...args: unknown[]): string;
export declare function createPrettyLogWithName(config: {
    name: string;
}, ...messages: unknown[]): string;
interface LoggerConfig {
    name: string;
    logSetting?: LogLevels;
}
/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
export declare class Logger {
    private name;
    private logSetting;
    private readonly levels;
    constructor({ name, logSetting }?: LoggerConfig);
    /**
     * Converts a string level (trace/debug/info/warn/error) into a number
     *
     * @param minLevel
     */
    private levelToInt;
    publishLog(logLevel: LogLevels, ...messages: unknown[]): void;
}
export {};
