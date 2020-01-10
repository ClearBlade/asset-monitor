import { Asset } from '../collection-schema/Assets';
import { Areas } from '../collection-schema/Areas';
import { Actions } from '../collection-schema/Actions';
export declare function getAllAssetsForType(assetType: string): Promise<Array<CbServer.CollectionSchema<Asset>>>;
export declare function getAllAreasForType(areaType: string): Promise<Array<CbServer.CollectionSchema<Areas>>>;
export declare function getActionByID(actionID: string): Promise<Actions>;
export interface EventState {
    is_open: boolean;
    state: string;
}
export declare function getStateForEvent(eventTypeId: string): Promise<EventState>;
export declare function createEvent(item: Record<string, string | boolean | number>): Promise<{
    item_id: string;
}[]>;
