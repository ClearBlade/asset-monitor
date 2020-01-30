import { CollectionName, GC } from '../global-config';
import '../../static/promise-polyfill';
import { Logger } from '../Logger';

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
    const logger = Logger({ name: 'CbCollectionLib' });
    if (!collectionName) {
        const errMsg = 'Remember to pass collection name while using the library :(';
        logger.publishLog(GC.LOG_LEVEL.ERROR, errMsg);
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
                logger.publishLog(GC.LOG_LEVEL.DEBUG, errMsg);
                reject(new Error(errMsg));
            }
            const col = ClearBlade.Collection({ collectionName });
            col.create(opts.item, function(err, res) {
                if (err) {
                    reject(new Error(res));
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
                logger.publishLog(GC.LOG_LEVEL.ERROR, errMsg);
                reject(new Error(errMsg));
            }
            col.update(opts.query, opts.changes, function(err, res) {
                if (err) {
                    logger.publishLog(GC.LOG_LEVEL.ERROR, 'ERROR: with update ', err, res, opts);
                    reject(new Error(res));
                } else {
                    logger.publishLog(GC.LOG_LEVEL.DEBUG, 'DEBUG: Updated ' + collectionName);
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
                logger.publishLog(GC.LOG_LEVEL.ERROR, errMsg);
                reject(new Error(errMsg));
            }
            col.fetch(query, function(err, res) {
                if (err) {
                    logger.publishLog(GC.LOG_LEVEL.ERROR, 'ERROR: with fetch ' + res);
                    reject(new Error(res));
                } else {
                    logger.publishLog(GC.LOG_LEVEL.DEBUG, 'DEBUG: Fetched Success: ' + collectionName);
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
