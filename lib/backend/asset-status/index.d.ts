import { UpdateAssetStatusSettings } from '../global-config';
interface UpdateAssetStatusConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    settings: UpdateAssetStatusSettings;
}
export declare function updateAssetStatusSS(config: UpdateAssetStatusConfig): void;
export declare const api: {
    default: typeof updateAssetStatusSS;
};
export {};
