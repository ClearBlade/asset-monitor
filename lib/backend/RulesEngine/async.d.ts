import { Asset } from '../collection-schema/Assets';
import { Areas } from '../collection-schema/Areas';
import { Actions } from '../collection-schema/Actions';
import { EventSchema } from '../collection-schema/Events';
import { SplitEntities } from './types';
export declare function getAllAssetsForType(assetType: string): Promise<Array<CbServer.CollectionSchema<Asset>>>;
export declare function getAllAreasForType(areaType: string): Promise<Array<CbServer.CollectionSchema<Areas>>>;
export declare function getAllAssets(): Promise<Array<CbServer.CollectionSchema<Asset>>>;
export declare function getAllAreas(): Promise<Array<CbServer.CollectionSchema<Areas>>>;
export declare function getActionByID(actionID: string): Promise<Actions>;
export declare function compareOverlappingEntities(event: EventSchema, splitEntities: SplitEntities): boolean | SplitEntities;
export declare function shouldCreateOrUpdateEvent(ruleID: string, splitEntities: SplitEntities, eventTypeId: string): Promise<boolean>;
export interface EventState {
    is_open: boolean;
    state: string;
}
export declare function getStateForEvent(eventTypeId: string): Promise<EventState>;
export declare function createEvent(item: Record<string, string | boolean | number>): Promise<{
    item_id: string;
}[]>;
export declare function createEventHistoryItem(item: Record<string, string | boolean | number>): Promise<{
    item_id: string;
}[]>;
export declare function closeRules(ids: string[], splitEntities: SplitEntities, timestamp?: string): Promise<boolean>;
