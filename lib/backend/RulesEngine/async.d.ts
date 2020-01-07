import { Asset } from '../collection-schema/Assets';
import { Areas } from '../collection-schema/Areas';
import { Actions } from '../collection-schema/Actions';
export declare function getAllAssetsForType(assetType: string): Promise<Array<CbServer.CollectionSchema<Asset>>>;
export declare function getAllAreasForType(areaType: string): Promise<Array<CbServer.CollectionSchema<Areas>>>;
export declare function getActionByID(actionID: string): Promise<Actions>;
export declare function getOpenStateForEvent(eventTypeId: string): Promise<string>;
export declare function createEvent(item: Record<string, unknown>): Promise<{
    item_id: string;
}[]>;
