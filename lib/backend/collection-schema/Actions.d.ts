export declare enum ActionTypes {
    SEND_SMS = "send_sms",
    SEND_EMAIL = "send_email",
    PUBLISH_MESSAGE = "publish_message"
}
export interface Actions {
    name?: string;
    config?: string;
    type?: ActionTypes;
    id?: string;
}
