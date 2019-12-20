export interface AssetHistory {
    change_date?: string;
    location_change?: boolean;
    asset_id?: string;
    asset_type?: string;
    status_change?: boolean;
    attribute_value?: string;
    attribute_name?: string;
}
export declare type AssetHistorySchema = AssetHistory & CbServer.CollectionSchema;
