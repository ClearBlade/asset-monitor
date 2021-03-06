"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function cbifyData(input, normalizerConfig) {
    var cbfiedData = {};
    Object.keys(normalizerConfig).forEach(function (value) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        cbfiedData[value] = input[normalizerConfig[value]];
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        delete input[normalizerConfig[value]];
    });
    //Process the custom_data structure
    if (typeof cbfiedData['custom_data'] === 'undefined') {
        cbfiedData['custom_data'] = input;
    }
    return cbfiedData;
}
exports.cbifyData = cbifyData;
function cbifyAll(input, normalizerConfig) {
    var cbfiedData = [];
    for (var i = 0, l = input.length; i < l; i++) {
        cbfiedData.push(cbifyData(input[i], normalizerConfig));
    }
    return cbfiedData;
}
exports.cbifyAll = cbifyAll;
function flattenJSON(data) {
    var result = {};
    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            result[prop] = cur;
        }
        else if (Array.isArray(cur)) {
            for (var i = 0, l = cur.length; i < l; i++)
                recurse(cur[i], prop ? prop + '.' + i : '' + i);
            if (cur.length === 0) {
                result[prop] = [];
            }
        }
        else {
            var isEmpty_1 = true;
            for (var p in cur) {
                isEmpty_1 = false;
                // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                // @ts-ignore
                recurse(cur[p], prop ? prop + '.' + p : p);
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            if (isEmpty_1)
                result[prop] = {};
        }
    }
    recurse(data, '');
    return result;
}
exports.flattenJSON = flattenJSON;
function flattenObjects(objArr) {
    var flattenedData = [];
    for (var i = 0, l = objArr.length; i < l; i++) {
        flattenedData.push(flattenJSON(objArr[i]));
    }
    return flattenedData;
}
exports.flattenObjects = flattenObjects;
function normalizeData(incomingData, normalizerConfig) {
    var dataToNormalize = [];
    if (incomingData instanceof Array) {
        dataToNormalize = incomingData;
    }
    else if (typeof incomingData === 'object') {
        dataToNormalize.push(incomingData);
    }
    else {
        return [];
    }
    var flattenedData = flattenObjects(dataToNormalize);
    var cbifiedData = cbifyAll(flattenedData, normalizerConfig);
    return cbifiedData;
}
exports.normalizeData = normalizeData;
function cbFormatMacAddress(macAddr) {
    //replace ':' by '-' and convert to upper case;
    return macAddr.replace(/:/gi, '-').toUpperCase();
}
exports.cbFormatMacAddress = cbFormatMacAddress;
exports.Topics = {
    AssetLocation: function (ASSETID) { return "_monitor/_asset/" + ASSETID + "/location"; },
    RulesAssetLocation: function (ASSETID) { return "_rules/_monitor/_asset/" + ASSETID; },
    DBUpdateAssetLocation: function (ASSETID) { return "_dbupdate/_monitor/_asset/" + ASSETID + "/location"; },
    HistoryAssetLocation: function (ASSETID) { return "_history/_monitor/_asset/" + ASSETID + "/location"; },
    AssetHistory: function (ASSETID) { return "_history/_monitor/_asset/" + ASSETID + "/location"; },
    DBUpdateAssetStatus: function (ASSETID) { return "_dbupdate/_monitor/_asset/" + ASSETID + "/status"; },
    AreaLocationEvent: function (AREAID) { return "_monitor/_area/" + AREAID + "/location"; },
    ListenAllAssetsLocation: function () { return "_monitor/_asset/+/location"; },
    ListenAllAssetsStatus: function () { return "_monitor/_asset/+/status"; },
};
//deprecated ...
function getAssetIdFromTopic(topic) {
    var splitTopic = topic.split('/');
    if (splitTopic.length != 7) {
        return '';
    }
    return splitTopic[5];
}
exports.getAssetIdFromTopic = getAssetIdFromTopic;
function isEmpty(str) {
    return !str || 0 === str.length;
}
exports.isEmpty = isEmpty;
/**
 * This function is used to check if the normalizedData is valid for the topics whose processing is handled by the libraries in this package
 * @param normalizedData
 */
function isNormalizedDataValid(normalizedData) {
    if (!(normalizedData instanceof Array) || normalizedData.length == 0) {
        return false;
    }
    for (var i = 0, l = normalizedData.length; i < l; i++) {
        if (isEmpty(normalizedData[i]['id'])) {
            return false;
        }
    }
    return true;
}
exports.isNormalizedDataValid = isNormalizedDataValid;
function getErrorMessage(error) {
    if (!!error && typeof error === 'object') {
        if (error.stack) {
            return error.stack;
        }
        else {
            if (error.message) {
                return error.message;
            }
            else {
                return JSON.stringify(error);
            }
        }
    }
    else {
        return error;
    }
}
exports.getErrorMessage = getErrorMessage;
function tryParse(str, fallback) {
    if (str) {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            return fallback;
        }
    }
    return fallback;
}
exports.tryParse = tryParse;
