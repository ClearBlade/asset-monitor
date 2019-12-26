import { LogLevels } from '../global-config';
export declare function prettyLog(...args: unknown[]): string;
export declare function createPrettyLogWithName(config: {
    name: string;
}, ...messages: unknown[]): string;
interface Loggable {
    publishLog(logLevel: LogLevels, ...message: unknown[]): void;
}
/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
export declare function Logger(config: {
    name: string;
}): Loggable;
export {};
