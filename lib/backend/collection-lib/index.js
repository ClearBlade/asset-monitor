"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@clearblade/promise-polyfill");
function CbCollectionLib(collectionName) {
    if (!collectionName) {
        var errMsg = 'Remember to pass collection name while using the library :(';
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
    function cbCreatePromise(opts) {
        return new Promise(function (resolve, reject) {
            if (!opts || !opts.item) {
                var errMsg = 'ERROR trying to create without an item ' + opts;
                reject(new Error(errMsg));
            }
            var col = ClearBlade.Collection({ collectionName: collectionName });
            col.create(opts.item, function (err, res) {
                if (err) {
                    reject(new Error(JSON.stringify(res)));
                }
                else {
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
    function cbUpdatePromise(opts) {
        return new Promise(function (resolve, reject) {
            var col = ClearBlade.Collection({ collectionName: collectionName });
            if (!opts || !opts.query || !opts.changes) {
                var errMsg = 'ERROR: query or changes object is missing';
                reject(new Error(errMsg));
            }
            col.update(opts.query, opts.changes, function (err, res) {
                if (err) {
                    reject(new Error(res));
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    /**
     * @param {} [query]
     * @returns {Promise}
     */
    function cbFetchPromise(opts) {
        return new Promise(function (resolve, reject) {
            var col = ClearBlade.Collection({ collectionName: collectionName });
            var query = opts.query;
            if (!query) {
                var errMsg = 'ERROR: query is missing';
                reject(new Error(errMsg));
            }
            col.fetch(query, function (err, res) {
                if (err) {
                    reject(new Error(JSON.stringify(res)));
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    function cbRemovePromise(opts) {
        return new Promise(function (resolve, reject) {
            var col = ClearBlade.Collection({ collectionName: collectionName });
            var query = opts.query;
            if (!query) {
                var errMsg = 'ERROR: query is missing';
                reject(new Error(errMsg));
            }
            col.remove(query, function (err, res) {
                if (err) {
                    reject(new Error(JSON.stringify(res)));
                }
                else {
                    resolve('success');
                }
            });
        });
    }
    return {
        cbCreatePromise: cbCreatePromise,
        cbUpdatePromise: cbUpdatePromise,
        cbFetchPromise: cbFetchPromise,
        cbRemovePromise: cbRemovePromise,
    };
}
exports.CbCollectionLib = CbCollectionLib;
