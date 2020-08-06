import { CollectionName } from '../global-config';
import '@clearblade/promise-polyfill';
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
interface CollectionDeleteOptions {
    query: CbServer.QueryObj;
}
interface CbCollectionLib {
    cbCreatePromise: (opts: CollectionCreateOptions) => Promise<CbServer.CollectionSchema[]>;
    cbUpdatePromise: (opts: CollectionUpdateOptions) => Promise<'success'>;
    cbFetchPromise: (opts: CollectionFetchOptions) => Promise<CbServer.CollectionFetchData>;
    cbRemovePromise: (opts: CollectionDeleteOptions) => Promise<'success'>;
}
export declare function CbCollectionLib(collectionName: CollectionName): CbCollectionLib;
export {};
