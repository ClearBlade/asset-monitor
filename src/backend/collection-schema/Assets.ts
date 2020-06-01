export interface ThreeDCoord {
    location_x: number;
    location_y: number;
    location_z: number;
    location_unit?: string;
}

export interface GeoCoord {
    latitude: number;
    longitude: number;
}

export interface Asset extends Partial<ThreeDCoord>, Partial<GeoCoord> {
    custom_data?: string | object;
    custom_id_1?: string;
    custom_id_2?: string;
    description?: string;
    id?: string;
    image?: string;
    label?: string;
    last_location_updated?: string;
    last_updated?: string;
    owners?: string;
    parent?: string;
    type?: string;
    group_id?: string;
}

export type AssetsSchema = Asset & CbServer.CollectionSchema;
