import { Asset } from '../collection-schema/Assets';
import { Areas } from '../collection-schema/Areas';
import { Actions } from '../collection-schema/Actions';
import { EventSchema } from '../collection-schema/Events';
export declare function getAllAssetsForType(assetType: string): Promise<Array<CbServer.CollectionSchema<Asset>>>;
export declare function getAllAreasForType(areaType: string): Promise<Array<CbServer.CollectionSchema<Areas>>>;
export declare function getActionByID(actionID: string): Promise<Actions>;
export interface Entities {
    [x: string]: Asset | Areas;
}
export interface SplitEntities {
    assets: Entities;
    areas: Entities;
}
export declare function entitiesAreEqual(event: EventSchema, splitEntities: SplitEntities): boolean;
export declare function shouldCreateEvent(ruleID: string, splitEntities: SplitEntities): Promise<boolean>;
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
