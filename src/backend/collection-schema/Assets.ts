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

export interface Assets
  extends Partial<ThreeDCoord>,
    Partial<GeoCoord>,
    // @ts-ignore - bad Clark
    CbServer.CollectionSchema {
  custom_data?: string | object;
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
