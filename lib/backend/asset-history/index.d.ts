import { CreateAssetHistoryOptions } from '../global-config';
interface CreateAssetHistoryConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options?: CreateAssetHistoryOptions;
}
export declare function createAssetHistorySS({ req, resp, options: { standardKeysToStore, customDataKeysToStore, LOG_SETTING, }, }: CreateAssetHistoryConfig): void;
export {};
