import { UpdateAssetLocationSettings } from '../global-config';
interface UpdateAssetLocationConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    settings: UpdateAssetLocationSettings;
}
export declare function updateAssetLocationSS(config: UpdateAssetLocationConfig): void;
export declare const api: {
    default: typeof updateAssetLocationSS;
};
export {};
