import { CbCollectionLib } from "../collection-lib";
import { CollectionName } from "../global-config";
import { Asset } from "../collection-schema/Assets";
import { Areas } from "../collection-schema/Areas";

export function getAllAssetsForType(assetType: string): Promise<Asset[]> {
  console.log('in getAllAssets things');
  const assetsCollection = CbCollectionLib(CollectionName.ASSETS);
  const assetsCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.ASSETS });
  assetsCollectionQuery.equalTo('type', assetType);

  const promise = (assetsCollection as {cbFetchPromise: (opts: CollectionFetchOptions) => Promise<any>}).cbFetchPromise({query: assetsCollectionQuery}).then((data) => {
    return Array.isArray(data.DATA) ? data.DATA : [];
  })
  // @ts-ignore
  Promise.runQueue();
  return promise;
}

export function getAllAreasForType(areaType: string): Promise<Areas[]> {
  console.log('in getAllAreas things');
  const areasCollection = CbCollectionLib(CollectionName.AREAS);
  const areasCollectionQuery = ClearBlade.Query({ collectionName: CollectionName.AREAS });
  areasCollectionQuery.equalTo("type", areaType);

  const promise = areasCollection.cbFetchPromise({query: areasCollectionQuery}).then((data) => {
    return Array.isArray(data.DATA) ? data.DATA : [];
  })
  // @ts-ignore
  Promise.runQueue();
  return promise;
}