import { CollectionName } from '../../global-config';
import { Asset } from '../../collection-schema/Assets';
import { Areas } from '../../collection-schema/Areas';
import { ParentOperator } from '../utils';

// Time Frames

export enum TimeFrameTypes {
    REPEATEACHWEEK = 'repeatEachWeek',
    REPEATBYDAY = 'repeatByDay',
}

export enum Days {
    SUNDAY = 'sunday',
    MONDAY = 'monday',
    TUESDAY = 'tuesday',
    WEDNESDAY = 'wednesday',
    THURSDAY = 'thursday',
    FRIDAY = 'friday',
    SATURDAY = 'saturday',
}

export interface TimeFrame {
    type: TimeFrameTypes;
    startTime: string;
    endTime: string;
    days: Array<Days>;
}

export const DaysOfTheWeek: Array<Days> = [
    Days.SUNDAY,
    Days.MONDAY,
    Days.TUESDAY,
    Days.WEDNESDAY,
    Days.THURSDAY,
    Days.FRIDAY,
    Days.SATURDAY,
];

// Duration

export enum DurationUnits {
    SECONDS = 's',
    MINUTES = 'm',
    HOURS = 'h',
    DAYS = 'd',
}

export interface Duration {
    value: number;
    unit: DurationUnits;
}

// Special Case Operators (true/false/inside/outside)

export interface OperatorAndValue {
    operator: string;
    value: string | number | boolean;
}

export function GetOperatorAndValue(op: string, val: string | number | boolean): OperatorAndValue {
    switch (op) {
        case 'true':
        case 'false':
        case 'inside':
        case 'outside':
            return { operator: 'equal', value: op };
        default:
            return { operator: op, value: val };
    }
}

// Conditions (ClearBlade conditions format)

export enum ConditionalOperators {
    AND = 'and',
    OR = 'or',
}

export enum EntityTypes {
    ASSET = 'assets',
    ASSET_TYPE = 'asset_types',
    AREA = 'areas',
    AREA_TYPE = 'area_types',
    STATE = 'state',
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

export type ConditionArray = Array<Condition | Conditions>;

export type Conditions = {
    [x in ConditionalOperators]?: ConditionArray;
};

// Rules Engine Event Params (json-rules-engine format)

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

// Condition Params

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
    id2: string; // areaId
    type2: string; // areaType
}

// Rule Processing

export interface WithParsedCustomData extends Asset {
    custom_data: Record<string, object>;
    entityType?: EntityTypes;
}

export interface ProcessedCondition {
    id: string;
    result: boolean;
    duration: number;
    timerStart: number;
}

export interface Entities {
    [x: string]: Asset | Areas;
}

export interface SplitEntities {
    assets: Entities;
    areas: Entities;
}
