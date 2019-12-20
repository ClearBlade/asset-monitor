import { Assets } from "../../collection-schema/assets";
import { catchClause } from "@babel/types";

export function getAllAssetsForType(): Promise<Assets[]> {
  return new Promise((resolve) => {
    resolve(assets);
  });
}

const assets: Assets[] = [
  {
      custom_data: {},
      description: '',
      id: 'testAsset1',
      image: '',
      item_id: 'test1',
      label: 'Test Asset 1',
      last_updated: '',
      owners: '',
      parent: '',
      type: 'train',
      latitude: null,
      longitude: null,
  },
  {
      custom_data: {},
      description: '',
      id: 'testAsset2',
      image: '',
      item_id: 'test2',
      label: 'Test Asset 2',
      last_updated: '',
      owners: '',
      parent: '',
      type: 'train',
      latitude: null,
      longitude: null,
  }
]