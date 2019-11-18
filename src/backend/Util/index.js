"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Util() {
    function NormalizeData(incomingData, normalizerConfig) {
        var dataToNormalize = [];
        if (typeof incomingData === "object") {
            dataToNormalize.push(incomingData);
        }
        else if (incomingData instanceof Array) {
            dataToNormalize = incomingData;
        }
        else {
            return [];
        }
        var flattenedData = flattenObjects(dataToNormalize);
        var cbifiedData = CBifyAll(flattenedData, normalizerConfig);
        return cbifiedData;
    }
    function CBifyData(input, normalizerConfig) {
        var cbfiedData = {};
        Object.keys(normalizerConfig).forEach(function (value) {
            //@ts-ignore
            cbfiedData[value] = input[normalizerConfig[value]];
            //@ts-ignore
            delete input[normalizerConfig[value]];
        });
        cbfiedData["custom_data"] = {};
        Object.keys(input).forEach(function (value) {
            //@ts-ignore
            cbfiedData["custom_data"][value] = input[value];
        });
        return cbfiedData;
    }
    function CBifyAll(input, normalizerConfig) {
        var cbfiedData = [];
        for (var i = 0, l = input.length; i < l; i++) {
            cbfiedData.push(CBifyData(input[i], normalizerConfig));
        }
        return cbfiedData;
    }
    function flattenObjects(objArr) {
        var flattenedData = [];
        for (var i = 0, l = objArr.length; i < l; i++) {
            flattenedData.push(flattenJSON(objArr[i]));
        }
        return flattenedData;
    }
    function flattenJSON(data) {
        var result = {};
        function recurse(cur, prop) {
            if (Object(cur) !== cur) {
                //@ts-ignore
                result[prop] = cur;
            }
            else if (Array.isArray(cur)) {
                for (var i = 0, l = cur.length; i < l; i++)
                    recurse(cur[i], prop ? prop + "." + i : "" + i);
                if (l == 0) {
                    //@ts-ignore
                    result[prop] = [];
                }
            }
            else {
                var isEmpty = true;
                for (var p in cur) {
                    isEmpty = false;
                    recurse(cur[p], prop ? prop + "." + p : p);
                }
                if (isEmpty)
                    //@ts-ignore
                    result[prop] = {};
            }
        }
        recurse(data, "");
        return result;
    }
    function CBFormatMacAddress(macAddr) {
        //replace ':' by '-' and convert to upper case;
        return macAddr.replace(/:/gi, "-").toUpperCase();
    }
    var Topics = {
        AssetLocation: function (ASSETID) { return "_monitor/_asset/" + ASSETID + "/location"; },
        RulesAssetLocation: function (ASSETID) { return "_rules/_monitor/_asset/" + ASSETID + "/location"; },
        DBUpdateAssetLocation: function (ASSETID) { return "_dbupdate/_monitor/_asset/" + ASSETID + "/location"; },
        HistoryAssetLocation: function (ASSETID) { return "_history/_monitor/_asset/" + ASSETID + "/location"; },
        AssetHistory: function (ASSETID) { return "_history/_monitor/_asset/" + ASSETID + "/location"; },
        DBUpdateAssetStatus: function (ASSETID) { return "_dbupdate/_monitor/_asset/" + ASSETID + "/status"; },
        AreaLocationEvent: function (AREAID) { return "_monitor/_area/" + AREAID + "/location"; },
        ListenAllAssetsLocation: function () { return "_monitor/_asset/+/location"; },
        ListenAllAssetsStatus: function () { return "_monitor/_asset/+/status"; }
    };
    function GetAssetIdFromTopic(topic) {
        var splitTopic = topic.split("/");
        if (splitTopic.length != 7) {
            return "";
        }
        return splitTopic[5];
    }
    function IsNormalizedDataValid(normalizedData) {
        if (!(normalizedData instanceof Array) || normalizedData.length == 0) {
            return false;
        }
        for (var i = 0, l = normalizedData.length; i < l; i++) {
            if (isEmpty(normalizedData[i]["id"])) {
                return false;
            }
        }
        return true;
    }
    function isEmpty(str) {
        return (!str || 0 === str.length);
    }
    return {
        NormalizeData: NormalizeData,
        CBifyData: CBifyData,
        CBifyAll: CBifyAll,
        flattenObjects: flattenObjects,
        flattenJSON: flattenJSON,
        CBFormatMacAddress: CBFormatMacAddress,
        Topics: Topics,
        GetAssetIdFromTopic: GetAssetIdFromTopic,
        IsNormalizedDataValid: IsNormalizedDataValid
    };
}
exports.Util = Util;
//@ts-ignore
global.Util = Util;
