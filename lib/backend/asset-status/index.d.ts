import { UpdateAssetStatusOptions } from '../global-config';
interface UpdateAssetStatusConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options: UpdateAssetStatusOptions;
}
export declare function updateAssetStatusSS({ req, resp, options: { LOG_SETTING, UPDATE_METHOD, }, }: UpdateAssetStatusConfig): void;
export declare const api: {
    default: typeof updateAssetStatusSS;
};
export {};
