/// <reference types="clearbladejs-server" />
import { CollectionName } from "../global-config";
import "../../static/promise-polyfill";
interface CollectionUpdateOptions {
    query: CbServer.QueryObj;
    changes: Record<string, any>;
}
interface CollectionCreateOptions {
    item: Record<string, any> | Array<Record<string, any>>;
}
interface CollectionFetchOptions {
    query: CbServer.QueryObj;
}
export declare function CbCollectionLib(collectionName: CollectionName): {
    cbCreatePromise: (opts: CollectionCreateOptions) => Promise<unknown>;
    cbUpdatePromise: (opts: CollectionUpdateOptions) => Promise<unknown>;
    cbFetchPromise: (opts: CollectionFetchOptions) => Promise<any>;
} | undefined;
export {};
