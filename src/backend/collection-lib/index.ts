import { CollectionName, GC } from "../global-config";
import { Logger } from "../logger";
import "../promise-polyfill";

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;

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

export function CbCollectionLib(collectionName: CollectionName) {
  let logger = Logger();
  if (!collectionName) {
    logger.publishLog(
      GC.LOG_LEVEL.ERROR,
      "Remember to pass collection name while using the library :("
    );
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
  function cbCreatePromise(opts: CollectionCreateOptions) {
    let promise = new Promise(function(resolve, reject) {
      if (!opts || !opts.item) {
        let errMsg = "ERROR trying to create without an item " + opts;
        logger.publishLog(GC.LOG_LEVEL.DEBUG, errMsg);
        reject(errMsg);
      }
      let col = ClearBlade.Collection({ collectionName });
      // @ts-ignore - bad Clark
      col.create(opts.item, function(err, res) {
        if (err) {
          reject(res);
        } else {
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
  function cbUpdatePromise(opts: CollectionUpdateOptions) {
    let promise = new Promise(function(resolve, reject) {
      let col = ClearBlade.Collection({ collectionName });

      if (!opts || !opts.query || !opts.changes) {
        let errMsg = "ERROR: query or changes object is missing";
        logger.publishLog(GC.LOG_LEVEL.ERROR, errMsg);
        reject(errMsg);
      }
      // @ts-ignore - bad Clark
      col.update(opts.query, opts.changes, function(err, res) {
        if (err) {
          logger.publishLog(
            GC.LOG_LEVEL.ERROR,
            "ERROR: with update ",
            err,
            res,
            opts
          );
          reject(res);
        } else {
          logger.publishLog(
            GC.LOG_LEVEL.DEBUG,
            "DEBUG: Updated " + collectionName
          );
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
  function cbFetchPromise(opts: CollectionFetchOptions) {
    // @ts-ignore - bad Clark
    let promise = new Promise<CbServer.CollectionFetchData>(function(
      resolve,
      reject
    ) {
      let col = ClearBlade.Collection({ collectionName: collectionName });
      let query = opts.query;
      if (!query) {
        let errMsg = "ERROR: query is missing";
        logger.publishLog(GC.LOG_LEVEL.ERROR, errMsg);
        reject(errMsg);
      }
      // @ts-ignore - bad Clark
      col.fetch(query, function(err, res) {
        if (err) {
          logger.publishLog(GC.LOG_LEVEL.ERROR, "ERROR: with fetch " + res);
          reject(res);
        } else {
          logger.publishLog(
            GC.LOG_LEVEL.DEBUG,
            "DEBUG: Fetched Success: " + collectionName
          );
          resolve(res);
        }
      });
    });
    return promise;
  }

  return {
    cbCreatePromise,
    cbUpdatePromise,
    cbFetchPromise
  };
}

//@ts-ignore
global.CbCollectionLib = CbCollectionLib;
