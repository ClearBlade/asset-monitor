"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@clearblade/promise-polyfill");
function RawQueryLib() {
    function cbQueryPromise(opts) {
        return new Promise(function (resolve, reject) {
            var database = ClearBlade.Database();
            if (!opts || !opts.query) {
                var errMsg = 'ERROR: raw query is missing';
                reject(new Error(errMsg));
            }
            database.query(opts.query, function (err, res) {
                if (err) {
                    reject(new Error('Error' + err));
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    function cbExecPromise(opts) {
        return new Promise(function (resolve, reject) {
            var database = ClearBlade.Database();
            if (!opts || !opts.query) {
                var errMsg = 'ERROR: raw query is missing';
                reject(new Error(errMsg));
            }
            database.exec(opts.query, function (err, res) {
                if (err) {
                    reject(new Error('Error' + err));
                }
                else {
                    resolve('success');
                }
            });
        });
    }
    return {
        cbQueryPromise: cbQueryPromise,
        cbExecPromise: cbExecPromise,
    };
}
exports.RawQueryLib = RawQueryLib;
