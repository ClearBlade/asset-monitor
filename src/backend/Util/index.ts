import { Assets } from "../CollectionSchemas/assets";
import { CustomConfig } from "../GlobalConfig";

export interface FlattenedObject{
    [key:string]:string|number|boolean|Array<any>;
}
export function Util() {

    function NormalizeData(incomingData:any, normalizerConfig: Assets): Array<Assets>{
        let dataToNormalize: Array<Object> = []
        if (typeof incomingData === "object"){
            dataToNormalize.push(incomingData);
        } else if(incomingData instanceof Array){
            dataToNormalize= incomingData;
        } else {
            return [];
        }
        var flattenedData: Array<FlattenedObject> = flattenObjects(dataToNormalize);
        var cbifiedData = CBifyAll(flattenedData, normalizerConfig);
        return cbifiedData;
    }
    function CBifyData(input: Assets, normalizerConfig: CustomConfig): Assets {
        var cbfiedData:Assets = {};
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

    function CBifyAll(input:Array<FlattenedObject>, normalizerConfig: Assets): Array<Assets>{
        let cbfiedData:Array<Assets> = [];
        for (let i = 0, l = input.length; i < l; i++) {
          cbfiedData.push(CBifyData(input[i], normalizerConfig));
        }
        return cbfiedData;
    }

    function flattenObjects(objArr: Array<Object>):Array<FlattenedObject> {
        let flattenedData: Array<FlattenedObject> = [];
        for (let i = 0, l = objArr.length; i < l; i++) {
            flattenedData.push(flattenJSON(objArr[i]));
        }
        return flattenedData;
    }

    function flattenJSON(data:Object): FlattenedObject {
        let result = {};
        
        function recurse(cur:any, prop: string) {
            if (Object(cur) !== cur) {
                //@ts-ignore
                result[prop] = cur;
            } else if (Array.isArray(cur)) {
                for (var i = 0, l = cur.length; i < l; i++)
                    recurse(cur[i], prop ? prop + "." + i : "" + i);
                if (l == 0){
                    //@ts-ignore
                    result[prop] = [];
                }
                    
            } else {
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

    function CBFormatMacAddress(macAddr:string): string {
        //replace ':' by '-' and convert to upper case;
        return macAddr.replace(/:/gi, "-").toUpperCase();
    }

    let Topics = {
         AssetLocation :(ASSETID: string) => `_monitor/_asset/${ASSETID}/location`,
         RulesAssetLocation :(ASSETID: string) => `_rules/_monitor/_asset/${ASSETID}/location`,
         DBUpdateAssetLocation :(ASSETID: string) => `_dbupdate/_monitor/_asset/${ASSETID}/location`,
         HistoryAssetLocation :(ASSETID: string) => `_history/_monitor/_asset/${ASSETID}/location`,
         AssetHistory :(ASSETID: string) => `_history/_monitor/_asset/${ASSETID}/location`,
         DBUpdateAssetStatus :(ASSETID: string) => `_dbupdate/_monitor/_asset/${ASSETID}/status`,
         AreaLocationEvent :(AREAID: string) => `_monitor/_area/${AREAID}/location`,
         ListenAllAssetsLocation :() => `_monitor/_asset/+/location`,
         ListenAllAssetsStatus :() => `_monitor/_asset/+/status`
    }

    function GetAssetIdFromTopic(topic:string): string{
        let splitTopic = topic.split("/");
        if(splitTopic.length != 7) {
          return "";
        }
        return splitTopic[5];
    }

    function IsNormalizedDataValid(normalizedData: Array<Assets>): boolean {
      if (!(normalizedData instanceof Array) || normalizedData.length == 0) {
        return false;
      }
      for (let i = 0, l = normalizedData.length; i < l; i++) {
        if (isEmpty(normalizedData[i]["id"])) {
          return false;
        }
      }
      return true;
    }

    function isEmpty(str:any): boolean{
        return (!str || 0 ===str.length);
    }

    return {
      NormalizeData,
      CBifyData,
      CBifyAll,
      flattenObjects,
      flattenJSON,
      CBFormatMacAddress,
      Topics,
      GetAssetIdFromTopic,
      IsNormalizedDataValid
    };
}

//@ts-ignore
global.Util = Util;