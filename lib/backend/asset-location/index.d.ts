import { UpdateAssetLocationOptions } from '../global-config';
interface UpdateAssetLocationConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options?: UpdateAssetLocationOptions;
}
export declare function updateAssetLocationSS({ req, resp, options: { KEYS_TO_UPDATE, LOG_SETTING, CREATE_NEW_ASSET_IF_MISSING, }, }: UpdateAssetLocationConfig): void;
export declare const api: {
    default: typeof updateAssetLocationSS;
};
export {};
