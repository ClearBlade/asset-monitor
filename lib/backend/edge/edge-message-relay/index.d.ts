declare const _default: ({ edgeShouldRelayAssetHistory, edgeShouldRelayAssetStatus, edgeShouldRelayLocation, edgeShouldRelayRules, topics, ...rest }: {
    req: CbServer.BasicReq<{
        [id: string]: unknown;
    }>;
    resp: CbServer.Resp;
    edgeShouldRelayLocation: boolean;
    edgeShouldRelayAssetStatus: boolean;
    edgeShouldRelayAssetHistory: boolean;
    edgeShouldRelayRules: boolean;
    topics: string[];
    cacheName?: string | undefined;
    collectionName?: string | undefined;
}) => void;
export default _default;
