"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require(".");
var incomingData = {
    id: 'yash_deviceid',
    type: 'testing',
    'locationCoordinate.x': 555.333,
    something: 'is up',
    goal: 'Incoming from CMX normalizer topic',
};
var config = {
    location_x: 'locationCoordinate.x',
    location_y: 'locationCoordinate.y',
    location_z: 'locationCoordinate.z',
    location_unit: 'locationCoordinate.unit',
    location_type: 'INDOOR/GPS',
    geo_latitude: 'geoCoordinate.latitude',
    geo_longitude: 'geoCoordinate.longitude',
    geo_altitude: '',
    geo_unit: 'geoCoordinate.unit',
    last_updated: 'lastSeen',
    last_location_updated: 'lastSeen',
    id: 'id',
    type: 'type'
};
var output = [
    {
        location_x: 555.333,
        location_y: undefined,
        location_z: undefined,
        location_unit: undefined,
        location_type: undefined,
        geo_latitude: undefined,
        geo_longitude: undefined,
        geo_altitude: undefined,
        geo_unit: undefined,
        last_updated: undefined,
        last_location_updated: undefined,
        id: 'yash_deviceid',
        type: 'testing',
        custom_data: {
            something: 'is up',
            goal: 'Incoming from CMX normalizer topic',
        },
    },
];
// let ans = normalizeData(incomingData, config);
// console.log(ans);
describe('Util', function () {
    it('normalizeData', function () {
        expect(_1.normalizeData(incomingData, config)).toEqual(output);
    });
});
