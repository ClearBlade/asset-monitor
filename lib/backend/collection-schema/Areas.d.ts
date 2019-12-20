/// <reference types="clearbladejs-server" />
export interface Areas extends CbServer.CollectionSchema {
    custom_data: string | Record<string, unknown>;
    description: string;
    id: string;
    image: string;
    item_id: string;
    label: string;
    last_updated: string;
    owners: string;
    parent: string;
    type: string;
    geometry_type: string;
    geometry_x: number;
    geometry_y: number;
    geometry_z: number;
    polygon: string;
    assets: string;
    latitude: number;
    longiutde: number;
}
