import { LogLevels } from "../GlobalConfig";
interface Loggable {
    publishLog(logLevel: LogLevels, ...message: any[]): any;
}
/**
 * Type: Module
 * Description: A library that contains a function which, when called, returns an object with a public API.
 */
export declare function Logger(): Loggable;
export {};
