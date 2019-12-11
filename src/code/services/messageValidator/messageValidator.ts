/**
 * Type: Micro Service
 * Description: A short-lived service which is expected to complete within a fixed period of time.
 * @param {CbServer.BasicReq} req
 * @param {string} req.systemKey
 * @param {string} req.systemSecret
 * @param {string} req.userEmail
 * @param {string} req.userid
 * @param {string} req.userToken
 * @param {boolean} req.isLogging
 * @param {[id: string]} req.params
 * @param {CbServer.Resp} resp
 */

var Ajv = require('ajv');
 // @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;



// @ts-ignore
var log: { (s: any): void } = global.log;

var data = {
    "records": [
        {
            "base": {
                "division": "vj9gu4",
                "msgId": "shardId-000000000000:49599809358236144620425247291850876068127379417234145282",
                "schemaVer": "0.6",
                "tss": 1570752147548,
                "deviceType": "at",
                "org": "h43ma4",
                "id": "at-atp3792bc3077e"
            },
            "data": {
                "info": [],
                "loc": [
                    {
                        "src": "g",
                        "requestTs": 1570730272,
                        "haccRank": 0,
                        "lon": -97.7494791,
                        "pdop": 4.77,
                        "ts": 1570730315,
                        "lat": 30.2727145,
                        "alt": 122.232,
                        "ttf": 46.3,
                        "hacc": 30.693
                    },
                    {
                        "src": "w",
                        "requestTs": 1570730272,
                        "haccRank": 1,
                        "lon": -97.74949847,
                        "pdop": 99,
                        "ts": 1570730320,
                        "lat": 30.27275552,
                        "alt": 777,
                        "calc": true,
                        "ttf": 0,
                        "hacc": 40
                    },
                    {
                        "src": "c",
                        "requestTs": 1570730272,
                        "haccRank": 2,
                        "lon": -97.748662,
                        "pdop": 99,
                        "ts": 1570730325,
                        "lat": 30.271525,
                        "alt": 777,
                        "calc": true,
                        "ttf": 0,
                        "hacc": 576
                    }
                ],
                "temp": [
                    {
                        "lvl": 4,
                        "c": 23.693,
                        "rh": 46.027,
                        "ts": 1570712273,
                        "tc": 0
                    },
                    {
                        "lvl": 4,
                        "c": 23.33,
                        "rh": 47.356,
                        "ts": 1570715873,
                        "tc": 0
                    },
                    {
                        "lvl": 3,
                        "c": 23.263,
                        "rh": 48.578,
                        "ts": 1570719473,
                        "tc": 0
                    },
                    {
                        "lvl": 3,
                        "c": 22.967,
                        "rh": 49.31,
                        "ts": 1570723072,
                        "tc": 0
                    },
                    {
                        "lvl": 3,
                        "c": 22.94,
                        "rh": 50.47,
                        "ts": 1570726673,
                        "tc": 0
                    },
                    {
                        "lvl": 3,
                        "c": 22.916,
                        "rh": 49.748,
                        "ts": 1570730273,
                        "tc": 0
                    },
                    {
                        "lvl": 3,
                        "c": 23.018,
                        "rh": 51.587,
                        "ts": 1570733873,
                        "tc": 0
                    }
                ],
                "accel": [
                    {
                        "y": -0.0039,
                        "x": 0.0049,
                        "z": 0.9805,
                        "ts": 1570712272
                    },
                    {
                        "y": -0.0049,
                        "x": 0.0039,
                        "z": 0.9844,
                        "ts": 1570712273
                    },
                    {
                        "y": -0.0059,
                        "x": 0.0049,
                        "z": 0.9814,
                        "ts": 1570715873
                    },
                    {
                        "y": -0.0049,
                        "x": 0.0029,
                        "z": 0.9824,
                        "ts": 1570719473
                    },
                    {
                        "y": -0.0039,
                        "x": 0,
                        "z": 0.9854,
                        "ts": 1570723072
                    },
                    {
                        "y": -0.0029,
                        "x": 0.0049,
                        "z": 0.9824,
                        "ts": 1570723073
                    },
                    {
                        "y": -0.0039,
                        "x": 0.0039,
                        "z": 0.9834,
                        "ts": 1570726673
                    },
                    {
                        "y": -0.0059,
                        "x": 0.0029,
                        "z": 0.9854,
                        "ts": 1570730273
                    }
                ],
                "deviceStatus": [
                    {
                        "rsrq": -7,
                        "rsrp": -72,
                        "powerUptime": 12388975,
                        "network": "lte",
                        "battery": 6.84,
                        "signal": 4,
                        "ts": 1570752155,
                        "rssi": -59,
                        "estBattPct": 85.3
                    }
                ],
                "events": []
            }
        }
    ]
}

var schema = {
    "$id": "undefined/undefined/<CollectionName>/<RowId>",
    "description": "JSON schema definition describing data received from Nimbelink asset tracking devices",
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "NimbleLink Asset Tracking Device Schema",
    "type": "object",
    "required": [
        "records"
    ],
    "properties": {
        "records": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/record"
            }
        }
    },
    "definitions": {
        "record": {
            "type": "object",
            "required": [
                "base"
            ],
            "properties": {
                "base": {
                    "$ref": "#/definitions/base"
                },
                "data": {
                    "$ref": "#/definitions/data"
                }
            }
        },
        "base": {
            "type": "object",
            "required": [
                "tss",
                "deviceType",
                "id"
            ],
            "properties": {
                "schemaVer": {
                    "description": "division - NimbeLink assigned",
                    "type": "string"
                },
                "msgId": {
                    "description": "Random string for this record",
                    "type": "string"
                },
                "tss": {
                    "description": "milliseconds since unix epoch",
                    "type": "number"
                },
                "deviceType": {
                    "description": "class of the hardware device",
                    "type": "string"
                },
                "id": {
                    "description": "unique device id",
                    "type": "string"
                },
                "org": {
                    "description": "organization - NimbeLink assigned",
                    "type": "string"
                }
            }
        },
        "data": {
            "type": "object",
            "required": [],
            "properties": {
                "info": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/info"
                    }
                },
                "loc": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/loc"
                    }
                },
                "temp": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/temp"
                    }
                },
                "accel": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/accel"
                    }
                },
                "deviceStatus": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/deviceStatus"
                    }
                },
                "events": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/events"
                    }
                }
            }
        },
        "deviceStatus": {
            "type": "object",
            "required": [
                "ts",
                "battery",
                "signal",
                "estBattPct",
                "powerUptime",
                "rssi",
                "rsrp",
                "rsrq",
                "network"
            ],
            "properties": {
                "ts": {
                    "description": "seconds since unix epoch",
                    "type": "number"
                },
                "battery": {
                    "description": "battery level",
                    "type": "number"
                },
                "signal": {
                    "description": "Cellular signal ( bars )",
                    "type": "number"
                },
                "estBattPct": {
                    "description": "Estimated battery percentage remaining ( % )",
                    "type": "number"
                },
                "powerUptime": {
                    "description": "seconds since the batteries were last inserted ( seconds )",
                    "type": "number"
                },
                "rssi": {
                    "description": "Cellular RSSI ( dBm )",
                    "type": "number"
                },
                "rsrp": {
                    "description": "Cellular RSRP ( dBm )",
                    "type": "number"
                },
                "rsrq": {
                    "description": "Cellular RSRQ ( dB )",
                    "type": "number"
                },
                "network": {
                    "description": "Cellular network used ( lte, 2g )",
                    "type": "string"
                }
            }
        },
        "accel": {
            "type": "object",
            "required": [
                "ts",
                "x",
                "y",
                "z"
            ],
            "properties": {
                "ts": {
                    "description": "seconds since unix epoch",
                    "type": "number"
                },
                "x": {
                    "description": "X axis measurement",
                    "type": "number"
                },
                "y": {
                    "description": "Y axis measurement",
                    "type": "number"
                },
                "z": {
                    "description": "Z axis measurement",
                    "type": "number"
                },
                "evt": {
                    "description": "event flag",
                    "type": "string"
                }
            }
        },
        "temp": {
            "type": "object",
            "required": [
                "ts",
                "tc",
                "lvl",
                "c"
            ],
            "properties": {
                "ts": {
                    "description": "seconds since unix epoch",
                    "type": "number"
                },
                "tc": {
                    "description": "number of samples averaged",
                    "type": "number"
                },
                "lvl": {
                    "description": "temperature level ( range = 0 - 5 )",
                    "type": "number"
                },
                "c": {
                    "description": "temperature in Celsius",
                    "type": "number"
                },
                "rh": {
                    "description": "relative humidity ( % )",
                    "type": "string"
                }
            }
        },
        "loc": {
            "type": "object",
            "required": [
                "ts",
                "lat",
                "lon",
                "alt",
                "hacc",
                "pdop",
                "ttf",
                "requestTs",
                "haccRank",
                "src"
            ],
            "properties": {
                "ts": {
                    "description": "seconds since unix epoch",
                    "type": "number"
                },
                "lat": {
                    "description": "latitude in degrees",
                    "type": "number"
                },
                "lon": {
                    "description": "longitude in degrees",
                    "type": "number"
                },
                "alt": {
                    "description": "altitude in meters",
                    "type": "number"
                },
                "hacc": {
                    "description": "horizontal accuracy in meters",
                    "type": "number"
                },
                "pdop": {
                    "description": "position dilution of precision",
                    "type": "number"
                },
                "ttf": {
                    "description": "time to fix in seconds",
                    "type": "number"
                },
                "requestTs": {
                    "description": "timestamp that this location request started on the device",
                    "type": "number"
                },
                "haccRank": {
                    "description": "horizontal accuracy rank (0 = best location for that request)",
                    "type": "number"
                },
                "calc": {
                    "description": "true if location not obtained via GPS",
                    "type": "boolean"
                },
                "src": {
                    "description": "event flag",
                    "type": "string"
                }
            }
        },
        "events": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/event"
            }
        },
        "event": {
            "required": [],
            "properties": {
                "ts": {
                    "description": "seconds since unix epoch",
                    "type": "number"
                },
                "eventName": {
                    "description": "The type of event",
                    "type": "string"
                }
            }
        },
        "info": {
            "type": "object",
            "required": [
                "ts",
                "x",
                "y",
                "z"
            ],
            "properties": {
                "ts": {
                    "description": "timestamp when the record was generated",
                    "type": "number"
                },
                "description": {
                    "description": "short description of info record",
                    "type": "string"
                },
                "requestTs": {
                    "description": "timestamp that this location request started on the device",
                    "type": "number"
                }
            }
        }
    }
}
export function messageValidator(req: CbServer.BasicReq, resp: CbServer.Resp) {
    // These are parameters passed into the code service
    var params = req.params
    //log(params);
    var payload = JSON.parse(params.body);
    data = payload["$data"];
    schema = payload["$config"];
    
    var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
    var validate = ajv.compile(schema);
    var valid = validate(data);
    if (!valid) {
        log(validate.errors);
        resp.error(validate.errors);
    } 
    resp.success("Success");
}


// @ts-ignore
global.messageValidator = messageValidator;
