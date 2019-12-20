"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/////////////////////////////////////////////////////////////////////////////////////
// Time Frames
var TimeFrameTypes;
(function (TimeFrameTypes) {
    TimeFrameTypes["REPEATEACHWEEK"] = "repeatEachWeek";
    TimeFrameTypes["REPEATBYDAY"] = "repeatByDay";
})(TimeFrameTypes = exports.TimeFrameTypes || (exports.TimeFrameTypes = {}));
;
var Days;
(function (Days) {
    Days["SUNDAY"] = "sunday";
    Days["MONDAY"] = "monday";
    Days["TUESDAY"] = "tuesday";
    Days["WEDNESDAY"] = "wednesday";
    Days["THURSDAY"] = "thursday";
    Days["FRIDAY"] = "friday";
    Days["SATURDAY"] = "saturday";
})(Days = exports.Days || (exports.Days = {}));
;
;
exports.DaysOfTheWeek = [Days.SUNDAY, Days.MONDAY, Days.TUESDAY, Days.WEDNESDAY, Days.THURSDAY, Days.FRIDAY, Days.SATURDAY];
/////////////////////////////////////////////////////////////////////////////////////
// Duration
var DurationUnits;
(function (DurationUnits) {
    DurationUnits["SECONDS"] = "s";
    DurationUnits["MINUTES"] = "m";
    DurationUnits["HOURS"] = "h";
    DurationUnits["DAYS"] = "d";
})(DurationUnits = exports.DurationUnits || (exports.DurationUnits = {}));
;
;
function GetOperatorAndValue(op, val) {
    switch (op) {
        case "true":
        case "false":
        case "inside":
        case "outside":
            return { operator: "equal", value: op };
        default:
            return { operator: op, value: val };
    }
}
exports.GetOperatorAndValue = GetOperatorAndValue;
/////////////////////////////////////////////////////////////////////////////////////
// Conditions (ClearBlade conditions format)
var ConditionalOperators;
(function (ConditionalOperators) {
    ConditionalOperators["AND"] = "and";
    ConditionalOperators["OR"] = "or";
})(ConditionalOperators = exports.ConditionalOperators || (exports.ConditionalOperators = {}));
;
var EntityTypes;
(function (EntityTypes) {
    EntityTypes["ASSET"] = "assets";
    EntityTypes["ASSET_TYPE"] = "asset_types";
    EntityTypes["AREA"] = "areas";
    EntityTypes["AREA_TYPE"] = "area_types";
    EntityTypes["STATE"] = "state";
})(EntityTypes = exports.EntityTypes || (exports.EntityTypes = {}));
;
;
;
;
/////////////////////////////////////////////////////////////////////////////////////
// Rules Engine Condition Format (json-rules-engine format)
var RulesEngineConditionalOperators;
(function (RulesEngineConditionalOperators) {
    RulesEngineConditionalOperators["AND"] = "all";
    RulesEngineConditionalOperators["OR"] = "any";
})(RulesEngineConditionalOperators = exports.RulesEngineConditionalOperators || (exports.RulesEngineConditionalOperators = {}));
;
;
;
;
;
