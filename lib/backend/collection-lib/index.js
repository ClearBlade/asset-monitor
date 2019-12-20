"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_config_1 = require("../global-config");
require("../../static/promise-polyfill");
var Logger_1 = require("../Logger");
// @ts-ignore
var ClearBlade = global.ClearBlade;
function CbCollectionLib(collectionName) {
    var logger = Logger_1.Logger();
    if (!collectionName) {
        logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, "Remember to pass collection name while using the library :(");
        return;
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
        var promise = new Promise(function (resolve, reject) {
            if (!opts || !opts.item) {
                var errMsg = "ERROR trying to create without an item " + opts;
                logger.publishLog(global_config_1.GC.LOG_LEVEL.DEBUG, errMsg);
                reject(errMsg);
            }
            var col = ClearBlade.Collection({ collectionName: collectionName });
            // @ts-ignore - bad Clark
            col.create(opts.item, function (err, res) {
                if (err) {
                    reject(res);
                }
                else {
                    resolve(res);
                }
            });
        });
        return promise;
    }
    /**
     * @param {{}} changes
     * @param {string} [item_id]
     * @param {{}} [query]
     * @returns {Promise}
     */
    function cbUpdatePromise(opts) {
        var promise = new Promise(function (resolve, reject) {
            var col = ClearBlade.Collection({ collectionName: collectionName });
            if (!opts || !opts.query || !opts.changes) {
                var errMsg = "ERROR: query or changes object is missing";
                logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, errMsg);
                reject(errMsg);
            }
            // @ts-ignore - bad Clark
            col.update(opts.query, opts.changes, function (err, res) {
                if (err) {
                    logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, "ERROR: with update ", err, res, opts);
                    reject(res);
                }
                else {
                    logger.publishLog(global_config_1.GC.LOG_LEVEL.DEBUG, "DEBUG: Updated " + collectionName);
                    resolve(res);
                }
            });
        });
        return promise;
    }
    /**
     * @param {} [query]
     * @returns {Promise}
     */
    function cbFetchPromise(opts) {
        // @ts-ignore - bad Clark
        var promise = new Promise(function (resolve, reject) {
            var col = ClearBlade.Collection({ collectionName: collectionName });
            var query = opts.query;
            if (!query) {
                var errMsg = "ERROR: query is missing";
                logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, errMsg);
                reject(errMsg);
            }
            // @ts-ignore - bad Clark
            col.fetch(query, function (err, res) {
                if (err) {
                    logger.publishLog(global_config_1.GC.LOG_LEVEL.ERROR, "ERROR: with fetch " + res);
                    reject(res);
                }
                else {
                    logger.publishLog(global_config_1.GC.LOG_LEVEL.DEBUG, "DEBUG: Fetched Success: " + collectionName);
                    resolve(res);
                }
            });
        });
        return promise;
    }
    return {
        cbCreatePromise: cbCreatePromise,
        cbUpdatePromise: cbUpdatePromise,
        cbFetchPromise: cbFetchPromise
    };
}
exports.CbCollectionLib = CbCollectionLib;
//@ts-ignore
global.CbCollectionLib = CbCollectionLib;
