import '../static/promise-polyfill/index.js';
interface EdgeMessageRelayConfig {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    edgeShouldRelayLocation: boolean;
    edgeShouldRelayAssetStatus: boolean;
    edgeShouldRelayAssetHistory: boolean;
    edgeShouldRelayRules: boolean;
    cacheName?: string;
    collectionName?: string;
}
declare function edgeMessageRelay({ req, resp, edgeShouldRelayLocation, edgeShouldRelayAssetStatus, edgeShouldRelayAssetHistory, edgeShouldRelayRules, cacheName, collectionName, }: EdgeMessageRelayConfig): void;
export default edgeMessageRelay;
