import { CreateAssetHistoryOptions } from '../global-config';
import '../../static/promise-polyfill';
interface CreateAssetHistoryConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    options?: CreateAssetHistoryOptions;
}
export declare function createAssetHistorySS({ req, resp, options: { STANDARD_KEYS_TO_STORE, CUSTOM_DATA_KEYS_TO_STORE, LOG_SETTING, LOG_SERVICE_NAME, CUSTOM_DATA_KEY_STORAGE_SETTING, STANDARD_KEY_STORAGE_SETTING, }, }: CreateAssetHistoryConfig): void;
export {};
