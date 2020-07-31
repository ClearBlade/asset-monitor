import '@clearblade/promise-polyfill';
declare type RawQuery = string;
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
export declare function RawQueryLib(): RawQueryLib;
export {};
