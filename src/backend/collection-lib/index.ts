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

export function CbCollectionLib(collectionName: CollectionName): CbCollectionLib {
    if (!collectionName) {
        const errMsg = 'Remember to pass collection name while using the library :(';
        throw new Error(errMsg);
    }

    /**
     * @typedef Item
     * @property {string} [item_id]
     *
     */

    /**
     * @param {Item} item
     * @returns {Promise}
     */
    function cbCreatePromise(opts: CollectionCreateOptions): Promise<CbServer.CollectionSchema[]> {
        return new Promise(function(resolve, reject) {
            if (!opts || !opts.item) {
                const errMsg = 'ERROR trying to create without an item ' + opts;
                reject(new Error(errMsg));
            }
            const col = ClearBlade.Collection({ collectionName });
            col.create(opts.item, function(err, res) {
                if (err) {
                    reject(new Error(JSON.stringify(res)));
                } else {
                    resolve(res);
                }
            });
        });
    }

    /**
     * @param {{}} changes
     * @param {string} [item_id]
     * @param {{}} [query]
     * @returns {Promise}
     */
    function cbUpdatePromise(opts: CollectionUpdateOptions): Promise<'success'> {
        return new Promise(function(resolve, reject) {
            const col = ClearBlade.Collection({ collectionName });

            if (!opts || !opts.query || !opts.changes) {
                const errMsg = 'ERROR: query or changes object is missing';
                reject(new Error(errMsg));
            }
            col.update(opts.query, opts.changes, function(err, res) {
                if (err) {
                    reject(new Error(res));
                } else {
                    resolve(res);
                }
            });
        });
    }

    /**
     * @param {} [query]
     * @returns {Promise}
     */
    function cbFetchPromise(opts: CollectionFetchOptions): Promise<CbServer.CollectionFetchData> {
        return new Promise(function(resolve, reject) {
            const col = ClearBlade.Collection({ collectionName: collectionName });
            const query = opts.query;
            if (!query) {
                const errMsg = 'ERROR: query is missing';
                reject(new Error(errMsg));
            }
            col.fetch(query, function(err, res) {
                if (err) {
                    reject(new Error(JSON.stringify(res)));
                } else {
                    resolve(res);
                }
            });
        });
    }

    return {
        cbCreatePromise,
        cbUpdatePromise,
        cbFetchPromise,
    };
}
