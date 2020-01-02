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
    value: boolean | string | number;
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
export interface Params {
    eventTypeID: string;
    actionIDs: Array<string>;
    priority: number;
    severity: number;
    timeframe?: TimeFrame;
    ruleID: string;
    ruleName: string;
}
