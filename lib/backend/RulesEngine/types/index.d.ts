import { CollectionName } from '../../global-config';
import { Asset } from '../../collection-schema/Assets';
import { Areas } from '../../collection-schema/Areas';
import { ParentOperator } from '../utils';
export declare enum TimeFrameTypes {
    REPEATEACHWEEK = "repeatEachWeek",
    REPEATBYDAY = "repeatByDay"
}
export declare enum Days {
    SUNDAY = "sunday",
    MONDAY = "monday",
    TUESDAY = "tuesday",
    WEDNESDAY = "wednesday",
    THURSDAY = "thursday",
    FRIDAY = "friday",
    SATURDAY = "saturday"
}
export interface TimeFrame {
    type: TimeFrameTypes;
    startTime: string;
    endTime: string;
    days: Array<Days>;
}
export declare const DaysOfTheWeek: Array<Days>;
export declare enum DurationUnits {
    SECONDS = "s",
    MINUTES = "m",
    HOURS = "h",
    DAYS = "d"
}
export interface Duration {
    value: number;
    unit: DurationUnits;
}
export interface OperatorAndValue {
    operator: string;
    value: string | number | boolean;
}
export declare function GetOperatorAndValue(op: string, val: string | number | boolean): OperatorAndValue;
export declare enum ConditionalOperators {
    AND = "and",
    OR = "or"
}
export declare enum EntityTypes {
    ASSET = "assets",
    ASSET_TYPE = "asset_types",
    AREA = "areas",
    AREA_TYPE = "area_types",
    STATE = "state"
}
export interface Entity {
    id: string;
    entity_type: EntityTypes;
}
export interface Relationship {
    attribute: string;
    attribute_type: EntityTypes;
    operator: string;
    value?: boolean | string | number;
    duration: Duration;
}
export interface Condition {
    entity: Entity;
    relationship: Relationship;
}
export declare type ConditionArray = Array<Condition | Conditions>;
export declare type Conditions = {
    [x in ConditionalOperators]?: ConditionArray;
};
export interface RuleParams {
    eventTypeID: string;
    actionIDs: Array<string>;
    priority: number;
    severity: number;
    timeframe?: TimeFrame;
    ruleID: string;
    ruleName: string;
    ruleType: ParentOperator;
    closesIds: string[];
}
export interface StateParams {
    id: string;
    attribute: string;
    collection: CollectionName;
    type: string;
    duration?: number;
}
export interface AreaParams {
    id: string;
    type: string;
    id2: string;
    type2: string;
}
declare type AssetsAndAreas = Asset & Areas;
export interface WithParsedCustomData extends AssetsAndAreas {
    custom_data: Record<string, object>;
    entityType?: EntityTypes;
}
export interface ProcessedCondition {
    id: string;
    associatedId: string;
    result: boolean;
    duration: number;
    timerStart: number;
    value: string | number | boolean;
    operator: string;
}
export interface Entities {
    [x: string]: Asset | Areas;
}
export interface SplitEntities {
    assets: Entities;
    areas: Entities;
}
export {};
