import relay from '@clearblade/one-way-sync/edge/edge-message-relay';
import { Topics, getAssetIdFromTopic } from '../../Util';

export default ({
    edgeShouldRelayAssetHistory,
    edgeShouldRelayAssetStatus,
    edgeShouldRelayLocation,
    edgeShouldRelayRules,
    topics = [],
    ...rest
}: {
    req: CbServer.BasicReq;
    resp: CbServer.Resp;
    edgeShouldRelayLocation: boolean;
    edgeShouldRelayAssetStatus: boolean;
    edgeShouldRelayAssetHistory: boolean;
    edgeShouldRelayRules: boolean;
    topics: string[];
    cacheName?: string;
    collectionName?: string;
}): ReturnType<typeof relay> => {
    const theTopics = [...topics];

    if (edgeShouldRelayLocation) {
        theTopics.push('$share/EdgeRelayGroup/' + Topics.DBUpdateAssetLocation('+'));
    }
    if (edgeShouldRelayAssetStatus) {
        theTopics.push('$share/EdgeRelayGroup/' + Topics.DBUpdateAssetStatus('+'));
    }
    if (edgeShouldRelayAssetHistory) {
        theTopics.push('$share/EdgeRelayGroup/' + Topics.AssetHistory('+'));
    }
    if (edgeShouldRelayRules) {
        theTopics.push('$share/EdgeRelayGroup/' + '_rules/_monitor/_asset/+');
    }

    return relay({
        ...rest,
        topics: theTopics,
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
                default:
                    return topic;
            }
        },
    });
};
