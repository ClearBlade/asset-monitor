import { LogLevels } from "../global-config";
interface Loggable {
    publishLog(logLevel: LogLevels, ...message: any[]): void;
}
/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
export declare function Logger(): Loggable;
export {};
