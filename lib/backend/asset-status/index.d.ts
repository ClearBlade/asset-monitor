import { UpdateAssetStatusOptions } from '../global-config';
import '../../static/promise-polyfill';
interface UpdateAssetStatusConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options: UpdateAssetStatusOptions;
}
export declare function updateAssetStatusSS({ req, resp, options: { LOG_SETTING, UPDATE_METHOD, }, }: UpdateAssetStatusConfig): void;
export {};
