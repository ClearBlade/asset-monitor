declare const _default: ({ edgeShouldRelayAssetHistory, edgeShouldRelayAssetStatus, edgeShouldRelayLocation, edgeShouldRelayRules, ...rest }: {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    edgeShouldRelayLocation: boolean;
    edgeShouldRelayAssetStatus: boolean;
    edgeShouldRelayAssetHistory: boolean;
    edgeShouldRelayRules: boolean;
    cacheName?: string | undefined;
    collectionName?: string | undefined;
}) => void;
export default _default;
