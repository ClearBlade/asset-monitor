export interface AssetHistory extends CbServer.CollectionSchema {
    change_date?: string;
    location_change?: boolean;
    asset_id?: string;
    asset_type?: string;
    status_change?: boolean;
    attribute_value?: any;
    attribute_name?: string;
}
