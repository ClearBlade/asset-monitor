/// <reference types="clearbladejs-server" />
import { CollectionName } from "../global-config";
import "../promise-polyfill";
interface CollectionUpdateOptions {
    query: CbServer.QueryObj;
    changes: Object;
}
interface CollectionCreateOptions {
    item: Object | Array<Object>;
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
