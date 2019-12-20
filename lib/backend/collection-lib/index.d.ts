/// <reference types="clearbladejs-server" />
import { CollectionName } from '../global-config';
import '../../static/promise-polyfill';
interface CollectionUpdateOptions {
    query: CbServer.QueryObj;
    changes: Record<string, unknown>;
}
interface CollectionCreateOptions {
    item: Record<string, unknown> | Array<Record<string, unknown>>;
}
interface CollectionFetchOptions {
    query: CbServer.QueryObj;
}
interface CbCollectionLib {
    cbCreatePromise: (opts: CollectionCreateOptions) => Promise<CbServer.CollectionSchema[]>;
    cbUpdatePromise: (opts: CollectionUpdateOptions) => Promise<'success'>;
    cbFetchPromise: (opts: CollectionFetchOptions) => Promise<CbServer.CollectionFetchData>;
}
export declare function CbCollectionLib(collectionName: CollectionName): CbCollectionLib;
export {};
