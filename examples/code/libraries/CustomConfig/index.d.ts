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
export declare const customConfig: {
    CMX_TO_CB_CONFIG: {
        "location_x": string;
        "location_y": string;
        "location_z": string;
        "location_unit": string;
        "location_type": string;
        "geo_latitude": string;
        "geo_longitude": string;
        "geo_altitude": string;
        "geo_unit": string;
        "last_updated": string;
        "last_location_updated": string;
        "id": string;
        "type": string;
    };
    getIncomingData: () => void;
};
