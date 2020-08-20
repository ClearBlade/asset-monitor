import { Asset } from '../collection-schema/Assets';
import { Logger } from '../Logger';
export default function createAsset(assetID: string, assetData: Asset, logger: Logger): Promise<unknown>;
