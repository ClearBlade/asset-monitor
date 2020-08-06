import '@clearblade/promise-polyfill';

type RawQuery = string;

interface RawQueryFetchOptions {
    query: RawQuery;
}

interface RawQueryExecOptions {
    query: RawQuery;
}

interface RawQueryLib {
    cbQueryPromise: (opts: RawQueryFetchOptions) => Promise<unknown[]>;
    cbExecPromise: (opts: RawQueryExecOptions) => Promise<'success'>;
}

export function RawQueryLib(): RawQueryLib {
    function cbQueryPromise(opts: RawQueryFetchOptions): Promise<unknown[]> {
        return new Promise(function(resolve, reject) {
            const database = ClearBlade.Database();

            if (!opts || !opts.query) {
                const errMsg = 'ERROR: raw query is missing';
                reject(new Error(errMsg));
            }
            database.query(opts.query, function(err, res) {
                if (err) {
                    reject(new Error('Error' + err));
                } else {
                    resolve(res);
                }
            });
        });
    }

    function cbExecPromise(opts: RawQueryExecOptions): Promise<'success'> {
        return new Promise(function(resolve, reject) {
            const database = ClearBlade.Database();

            if (!opts || !opts.query) {
                const errMsg = 'ERROR: raw query is missing';
                reject(new Error(errMsg));
            }
            database.exec(opts.query, function(err, res) {
                if (err) {
                    reject(new Error('Error' + err));
                } else {
                    resolve('success');
                }
            });
        });
    }

    return {
        cbQueryPromise,
        cbExecPromise,
    };
}
