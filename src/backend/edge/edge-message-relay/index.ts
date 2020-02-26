import relay from '@clearblade/one-way-sync/edge/edge-message-relay';
import { Topics, getAssetIdFromTopic } from '../../Util';

export default ({
    edgeShouldRelayAssetHistory,
    edgeShouldRelayAssetStatus,
    edgeShouldRelayLocation,
    edgeShouldRelayRules,
    ...rest
}: {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    edgeShouldRelayLocation: boolean;
    edgeShouldRelayAssetStatus: boolean;
    edgeShouldRelayAssetHistory: boolean;
    edgeShouldRelayRules: boolean;
    cacheName?: string;
    collectionName?: string;
}): ReturnType<typeof relay> => {
    const topics = [];
    if (edgeShouldRelayLocation) {
        topics.push('$share/EdgeRelayGroup/' + Topics.DBUpdateAssetLocation('+'));
    }
    if (edgeShouldRelayAssetStatus) {
        topics.push('$share/EdgeRelayGroup/' + Topics.DBUpdateAssetStatus('+'));
    }
    if (edgeShouldRelayAssetHistory) {
        topics.push('$share/EdgeRelayGroup/' + Topics.AssetHistory('+'));
    }
    if (edgeShouldRelayRules) {
        topics.push('$share/EdgeRelayGroup/' + '_rules/_monitor/_asset/+');
    }
    return relay({
        ...rest,
        topics,
        getRelayTopicSuffix: topic => {
            const assetId = getAssetIdFromTopic(topic);
            switch (topic) {
                case `$share/EdgeRelayGroup/${Topics.DBUpdateAssetLocation(assetId)}`:
                    if (edgeShouldRelayLocation) {
                        return Topics.DBUpdateAssetLocation(assetId);
                    }
                    break;
                case `$share/EdgeRelayGroup/${Topics.DBUpdateAssetStatus(assetId)}`:
                    if (edgeShouldRelayAssetStatus) {
                        return Topics.DBUpdateAssetStatus(assetId);
                    }
                    break;
                case `$share/EdgeRelayGroup/${Topics.AssetHistory(assetId)}`:
                    if (edgeShouldRelayAssetHistory) {
                        return Topics.AssetHistory(assetId);
                    }
                    break;
                case `$share/EdgeRelayGroup/_rules/_monitor/_asset/${assetId}`:
                    if (edgeShouldRelayAssetHistory) {
                        return '_rules/_monitor/_asset/' + assetId;
                    }
                    break;
            }
        },
    });
};
