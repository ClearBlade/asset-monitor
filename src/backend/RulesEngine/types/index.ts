import { string } from "prop-types";

/////////////////////////////////////////////////////////////////////////////////////
// Time Frames

export enum TimeFrameTypes {
    REPEATEACHWEEK = "repeatEachWeek",
    REPEATBYDAY = "repeatByDay"
}

export enum Days {
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

export const DaysOfTheWeek: Array<string> = [Days.SUNDAY, Days.MONDAY, Days.TUESDAY, Days.WEDNESDAY, Days.THURSDAY, Days.FRIDAY, Days.SATURDAY];

/////////////////////////////////////////////////////////////////////////////////////
// Duration

export enum DurationUnits {
    SECONDS = "s",
    MINUTES = "m",
    HOURS = "h",
    DAYS = "d"
}

export interface Duration {
    value: number;
    unit: DurationUnits;
}

/////////////////////////////////////////////////////////////////////////////////////
// Special Case Operators (true/false/inside/outside)


export interface OperatorAndValue {
    operator: string;
    value: string | number | boolean;
}

export function GetOperatorAndValue(op: string, val: string | number | boolean): OperatorAndValue {
    switch (op) {
      case "true":
      case "false":
      case "inside":
      case "outside":
        return {operator: "equal", value: op};
      default:
        return {operator: op, value: val};
    }
  }


/////////////////////////////////////////////////////////////////////////////////////
// Conditions (ClearBlade conditions format)

export enum ConditionalOperators {
    AND = "and",
    OR = "or"
}

export enum EntityTypes {
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

export type AllConditions = {
    [x in ConditionalOperators]: Array<Condition | AllConditions>;
};

/////////////////////////////////////////////////////////////////////////////////////
// Rules Engine Condition Format (json-rules-engine format)

export enum RulesEngineConditionalOperators {
    AND = "all",
    OR = "any"
}

export interface RulesEngineEvent {
    type: string;
    params: Params;
}

export interface RulesEngineCondition {
    fact: string;
    operator: string;
    value: boolean | number | string;
}

export type AllRulesEngineConditions = {
    [x in RulesEngineConditionalOperators]: Array<RulesEngineCondition | AllRulesEngineConditions>;
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

export interface Rule {
    name: string;
    conditions: AllRulesEngineConditions;
    event: RulesEngineEvent;
}

export interface RuleInfo {
    name: string;
    id: string;
}