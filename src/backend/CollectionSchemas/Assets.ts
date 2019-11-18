
export interface ThreeDCoord {
    location_x: number;
    location_y: number;
    location_z: number;
    location_unit?:string;
}

export interface GeoCoord {
    geo_altitude: number;
    geo_latitude: number;
    geo_longitude: number;
    geo_unit?: string;
}

export interface Assets extends Partial<ThreeDCoord>, Partial<GeoCoord>, CbServer.CollectionSchema {
    custom_data?: string | Object;
    custom_id_1?: string;
    custom_id_2?: string;
    description?: string;
    id?: string;
    image?: string;
    item_id?: string;
    label?: string;
    last_location_updated?: string;
    last_updated?: string;
    owners?: string;
    parent?: string;
    type?: string;
}
