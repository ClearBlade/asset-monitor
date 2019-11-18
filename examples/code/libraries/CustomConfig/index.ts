/**
 * Type: Configuration
 * Description: A library that contains a key-value object to be used as constants.
 * Add more configs, which user normally uses for normalizers
 * 
 * Info:
 * - The keys in normalizer config correspond to the assets collection schema
 * - The values correspond to the keys in normalized message, i.e. output of the normalizer service.
 * - The normalizer stream/micro service is expected to send data in with the right datatype & format defined by ClearBlade's internal Message Spec
 * - XXX_TO_CB_CONFIG = {} is the standard naming convention for configs for normalizers
 * 
 * Instructions:
 * - Uncomment the XXX_TO_CB_CONFIG object
 * - Replace XXX with a custom name based on the sender of the message
 * - Replace the TODO in the values with keys that correspond to keys in the normalized message
 * - Add this object to the customConfig object
 * - Recompile all the services and push it to the system
 */

// const XXX_TO_CB_CONFIG =  {
//         "location_x": "TODO",
//         "location_y": "TODO",
//         "location_z": "TODO",
//         "location_unit": "TODO",
//         "location_type": "TODO",
//         "geo_latitude": "TODO",
//         "geo_longitude": "TODO",
//         "geo_altitude": "TODO",
//         "geo_unit": "TODO",
//         "last_updated": "TODO",
//         "last_location_updated": "TODO",
//         "id": "TODO",
//         "type":"TODO"
//     }

export const customConfig = {
    CMX_TO_CB_CONFIG: {
        "location_x": "locationCoordinate.x",
        "location_y": "locationCoordinate.y",
        "location_z": "locationCoordinate.z",
        "location_unit": "locationCoordinate.unit",
        "location_type": "INDOOR/GPS",
        "geo_latitude": "geoCoordinate.latitude",
        "geo_longitude": "geoCoordinate.longitude",
        "geo_altitude": "",
        "geo_unit": "geoCoordinate.unit",
        "last_updated": "lastSeen",
        "last_location_updated": "lastSeen",
        "id": "deviceId",
        "type":"type"
    },
    getIncomingData: function(){
        
    }
};
