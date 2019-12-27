interface CreateAssetHistoryConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
}
export declare function createAssetHistorySS(config: CreateAssetHistoryConfig): void;
export declare const api: {
    default: typeof createAssetHistorySS;
};
export {};
