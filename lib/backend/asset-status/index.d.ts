interface UpdateAssetStatusConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
}
export declare function updateAssetStatusSS(config: UpdateAssetStatusConfig): void;
export declare const api: {
    default: typeof updateAssetStatusSS;
};
export {};
