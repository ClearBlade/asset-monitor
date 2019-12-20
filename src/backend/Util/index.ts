import { Assets } from '../collection-schema/Assets';
import { NormalizerDeviceMap } from '../global-config';

export interface FlattenedObject {
    [key: string]: string | number | boolean | Array<unknown>;
}

export function cbifyData(input: Assets, normalizerConfig: NormalizerDeviceMap): Assets {
    const cbfiedData: Assets = {};
    Object.keys(normalizerConfig).forEach(function(value) {
        cbfiedData[value] = input[normalizerConfig[value]];
        delete input[normalizerConfig[value]];
    });
    cbfiedData['custom_data'] = {};

    //Process the custom_data structure
    if (normalizerConfig.custom_data) {
        Object.keys(normalizerConfig.custom_data).forEach(function(value) {
            if (cbfiedData.custom_data) {
                (cbfiedData.custom_data as { [key: string]: string })[value] =
                    input[normalizerConfig.custom_data[value]];
            }
        });
    }
    return cbfiedData;
}

export function cbifyAll(input: Array<FlattenedObject>, normalizerConfig: NormalizerDeviceMap): Array<Assets> {
    const cbfiedData: Array<Assets> = [];
    for (let i = 0, l = input.length; i < l; i++) {
        cbfiedData.push(cbifyData(input[i], normalizerConfig));
    }
    return cbfiedData;
}

export function flattenJSON(data: Record<string, unknown>): FlattenedObject {
    const result: FlattenedObject = {};

    function recurse(cur: Record<string, unknown>, prop: string): void {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (let i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop ? prop + '.' + i : '' + i);
            if (cur.length === 0) {
                result[prop] = [];
            }
        } else {
            let isEmpty = true;
            for (const p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + '.' + p : p);
            }
            if (isEmpty) result[prop] = {};
        }
    }
    recurse(data, '');
    return result;
}

export function flattenObjects(objArr: Array<Record<string, unknown>>): Array<FlattenedObject> {
    const flattenedData: Array<FlattenedObject> = [];
    for (let i = 0, l = objArr.length; i < l; i++) {
        flattenedData.push(flattenJSON(objArr[i]));
    }
    return flattenedData;
}

export function normalizeData(incomingData: unknown, normalizerConfig: NormalizerDeviceMap): Array<Assets> {
    let dataToNormalize: Array<Record<string, unknown>> = [];
    if (incomingData instanceof Array) {
        dataToNormalize = incomingData;
    } else if (typeof incomingData === 'object') {
        dataToNormalize.push(incomingData);
    } else {
        return [];
    }
    const flattenedData: Array<FlattenedObject> = flattenObjects(dataToNormalize);
    const cbifiedData = cbifyAll(flattenedData, normalizerConfig);
    return cbifiedData;
}

export function cbFormatMacAddress(macAddr: string): string {
    //replace ':' by '-' and convert to upper case;
    return macAddr.replace(/:/gi, '-').toUpperCase();
}

export const Topics = {
    AssetLocation: (ASSETID: string): string => `_monitor/_asset/${ASSETID}/location`,
    RulesAssetLocation: (ASSETID: string): string => `_rules/_monitor/_asset/${ASSETID}/location`,
    DBUpdateAssetLocation: (ASSETID: string): string => `_dbupdate/_monitor/_asset/${ASSETID}/location`,
    HistoryAssetLocation: (ASSETID: string): string => `_history/_monitor/_asset/${ASSETID}/location`,
    AssetHistory: (ASSETID: string): string => `_history/_monitor/_asset/${ASSETID}/location`,
    DBUpdateAssetStatus: (ASSETID: string): string => `_dbupdate/_monitor/_asset/${ASSETID}/status`,
    AreaLocationEvent: (AREAID: string): string => `_monitor/_area/${AREAID}/location`,
    ListenAllAssetsLocation: (): string => `_monitor/_asset/+/location`,
    ListenAllAssetsStatus: (): string => `_monitor/_asset/+/status`,
};

export function getAssetIdFromTopic(topic: string): string {
    const splitTopic = topic.split('/');
    if (splitTopic.length != 7) {
        return '';
    }
    return splitTopic[5];
}

export function isEmpty(str: string): boolean {
    return !str || 0 === str.length;
}

export function isNormalizedDataValid(normalizedData: Array<Assets>): boolean {
    if (!(normalizedData instanceof Array) || normalizedData.length == 0) {
        return false;
    }
    for (let i = 0, l = normalizedData.length; i < l; i++) {
        if (isEmpty(normalizedData[i]['id'] as string)) {
            return false;
        }
    }
    return true;
}
