import { AssetType } from '../collection-schema/AssetType';
import { AssetTypeID, AssetTypeTree } from './assetTypeTree';
import { CollectionName } from '../global-config';
import { RawQueryLib } from '../collection-lib/raw-query';
import { CbCollectionLib } from '../collection-lib';
import { AssetTypeTreeSchema } from '../collection-schema/AssetTypeTree';

function fetchTree(): Promise<AssetTypeTree> {
    return RawQueryLib()
        .cbQueryPromise({ query: 'SELECT tree FROM asset_type_tree' })
        .then(data => {
            if (data.length > 1) {
                return Promise.reject(
                    'Error: There is more than one asset type tree in the collection; there should only be one.',
                );
            }
            const assetTypeTree = AssetTypeTree.treeFromString((data[0] as AssetTypeTreeSchema).tree);
            return Promise.resolve(assetTypeTree);
        });
}

function updateAssetTypeTreeCollection(assetTypeTree: AssetTypeTree): Promise<AssetTypeTree> {
    const query = ClearBlade.Query({ collectionName: CollectionName.ASSET_TYPE_TREE });
    query.limit = 1;

    return CbCollectionLib(CollectionName.ASSET_TYPE_TREE)
        .cbUpdatePromise({
            query: query,
            changes: {
                tree: AssetTypeTree.treeToString(assetTypeTree),
            },
        })
        .then(() => Promise.resolve(assetTypeTree));
}

function syncAssetTypeTreeWithAssetTypes(assetTypeTree: AssetTypeTree): Promise<AssetTypeTree> {
    return RawQueryLib()
        .cbQueryPromise({ query: 'SELECT id FROM asset_types' })
        .then(data => {
            const typesFromAssetTypesCollection = new Set(
                data.map(assetType => {
                    if ((assetType as AssetType).id) {
                        return (assetType as AssetType).id;
                    }
                }),
            ) as Set<AssetTypeID>;

            const typesFromTree = new Set(Object.keys(assetTypeTree.nodes));

            // Types added to the asset_types collection that are not in the tree yet.
            const typesToAddToTree = Array.from(typesFromAssetTypesCollection).filter(x => !typesFromTree.has(x));
            typesToAddToTree.forEach(assetTypeID => {
                if (assetTypeID) {
                    assetTypeTree.addAssetTypeToTree(assetTypeID);
                }
            });

            // Types removed from the asset_types collection that need to be removed from the tree.
            const typesToRemoveFromTree = Array.from(typesFromTree).filter(x => !typesFromAssetTypesCollection.has(x));
            typesToRemoveFromTree.forEach(assetTypeID => {
                if (assetTypeID) {
                    assetTypeTree.deleteAssetTypeFromTree(assetTypeID);
                }
            });

            return updateAssetTypeTreeCollection(assetTypeTree);
        });
}

function handleTrigger(assetTypeTree: AssetTypeTree, req: CbServer.BasicReq): Promise<string> {
    const trigger = req.params.trigger;
    let assetTypeIDs: AssetTypeID[];

    if (trigger === 'Data::ItemCreated') {
        const assetTypeItemIDs = (req.params['items'] as { item_id: string }[]).map(item => item.item_id);
        const idString = `(${assetTypeItemIDs.map(itemID => `"${itemID}"`).join(',')})`;
        const query = `SELECT id FROM asset_types WHERE item_id IN ${idString}`;

        return RawQueryLib()
            .cbQueryPromise({ query: query })
            .then(data => {
                assetTypeIDs = (data as { id: AssetTypeID }[]).map(assetType => assetType.id);
                assetTypeIDs.forEach(assetTypeID => {
                    if (assetTypeID) {
                        assetTypeTree.addAssetTypeToTree(assetTypeID);
                    }
                });

                return updateAssetTypeTreeCollection(assetTypeTree);
            })
            .then(() => {
                log(`${trigger}\n${assetTypeIDs}`);
                return Promise.resolve(trigger);
            });
    } else if (trigger === 'Data::ItemDeleted') {
        assetTypeIDs = (req.params['items'] as AssetType[]).map(assetType => assetType.id);
        assetTypeIDs.forEach(assetTypeID => {
            if (assetTypeID) {
                assetTypeTree.deleteAssetTypeFromTree(assetTypeID);
            }
        });

        return updateAssetTypeTreeCollection(assetTypeTree).then(() => {
            log(`${trigger}\n${assetTypeIDs}`);
            return Promise.resolve(trigger);
        });
    } else {
        return Promise.reject(`${trigger} not handled.`);
    }
}

function createAssetType(
    assetTypeTree: AssetTypeTree,
    createAssetTypeOptions: CreateAssetTypeOptions,
): Promise<string> {
    const assetType = createAssetTypeOptions.ASSET_TYPE;
    const assetTypeID = assetType.id;

    if (assetTypeID) {
        assetTypeTree.addAssetTypeToTree(assetTypeID);
        return addToAssetTypesCollection(assetType)
            .then(() => updateAssetTypeTreeCollection(assetTypeTree))
            .then(() => Promise.resolve(`${assetTypeID} created.`));
    } else {
        return Promise.reject('Error: Missing asset type id.');
    }
}

function deleteAssetType(
    assetTypeTree: AssetTypeTree,
    deleteAssetTypeoptions: DeleteAssetTypeOptions,
): Promise<string> {
    const assetTypeID = deleteAssetTypeoptions.ASSET_TYPE_ID;
    assetTypeTree.deleteAssetTypeFromTree(assetTypeID);

    return deleteFromAssetTypesCollection(assetTypeID)
        .then(() => updateAssetTypeTreeCollection(assetTypeTree))
        .then(() => Promise.resolve(`${assetTypeID} deleted.`));
}

function addChild(assetTypeTree: AssetTypeTree, options: AddOrRemoveChildOptions): Promise<string> {
    assetTypeTree.addChild(options.CHILD_ID, options.PARENT_ID);
    return updateAssetTypeTreeCollection(assetTypeTree).then(() => Promise.resolve('Child added.'));
}

function removeChild(assetTypeTree: AssetTypeTree, options: AddOrRemoveChildOptions): Promise<unknown> {
    assetTypeTree.removeChild(options.CHILD_ID, options.PARENT_ID);
    return updateAssetTypeTreeCollection(assetTypeTree).then(() => Promise.resolve(`Child removed.`));
}

function addToAssetTypesCollection(assetType: AssetType): Promise<unknown> {
    return CbCollectionLib(CollectionName.ASSET_TYPES).cbCreatePromise({
        item: {
            id: assetType.id,
            label: assetType.label,
            description: assetType.description,
            icon: assetType.icon,
            schema: assetType.schema,
        },
    });
}

function deleteFromAssetTypesCollection(assetTypeID: AssetTypeID): Promise<unknown> {
    return CbCollectionLib(CollectionName.ASSET_TYPES).cbRemovePromise({
        query: ClearBlade.Query({ collectionName: CollectionName.ASSET_TYPES }).equalTo('id', assetTypeID),
    });
}

function getTopLevelAssetTypes(assetTypeTree: AssetTypeTree): Promise<unknown[]> {
    const topLevelAssetTypesIDs = assetTypeTree.getTopLevelAssetTypeIDs();
    const idString = `(${topLevelAssetTypesIDs.map(assetID => `"${assetID}"`).join(',')})`;
    const query = `SELECT * FROM asset_types WHERE id in ${idString}`;

    return RawQueryLib()
        .cbQueryPromise({ query: query })
        .then(data => {
            return Promise.resolve(data as unknown[]);
        });
}

export enum AssetTypeTreeMethod {
    GET_TREE = 'getTree',
    GET_TOP_LEVEL_ASSET_TYPES = 'getTopLevelAssetTypes',
    CREATE_ASSET_TYPE = 'createAssetType',
    DELETE_ASSET_TYPE = 'deleteAssetType',
    ADD_CHILD = 'addChild',
    REMOVE_CHILD = 'removeChild',
}

export interface CreateAssetTypeOptions {
    ASSET_TYPE: AssetType;
}

export interface DeleteAssetTypeOptions {
    ASSET_TYPE_ID: AssetTypeID;
}

export interface AddOrRemoveChildOptions {
    CHILD_ID: AssetTypeID;
    PARENT_ID: AssetTypeID;
}

interface CreateOperation {
    METHOD: AssetTypeTreeMethod.CREATE_ASSET_TYPE;
    METHOD_OPTIONS: CreateAssetTypeOptions;
}

interface DeleteOperation {
    METHOD: AssetTypeTreeMethod.DELETE_ASSET_TYPE;
    METHOD_OPTIONS: DeleteAssetTypeOptions;
}

interface AddChildOperation {
    METHOD: AssetTypeTreeMethod.ADD_CHILD;
    METHOD_OPTIONS: AddOrRemoveChildOptions;
}

interface RemoveChildOperation {
    METHOD: AssetTypeTreeMethod.REMOVE_CHILD;
    METHOD_OPTIONS: AddOrRemoveChildOptions;
}

interface GetTreeOperation {
    METHOD: AssetTypeTreeMethod.GET_TREE;
}

interface GetTopLevelAssetTypesOperation {
    METHOD: AssetTypeTreeMethod.GET_TOP_LEVEL_ASSET_TYPES;
}

export type AssetTypeTreeOperations =
    | CreateOperation
    | DeleteOperation
    | AddChildOperation
    | RemoveChildOperation
    | GetTreeOperation
    | GetTopLevelAssetTypesOperation;

export function assetTypeTreeHandler(
    req: CbServer.BasicReq,
    resp: CbServer.Resp,
    options: AssetTypeTreeOperations,
): void {
    const successFn = (data: unknown): never => resp.success(data);
    const errorFn = (data: unknown): never => resp.error(data);

    const trigger = req.params.trigger;

    if (!options?.METHOD && !trigger) errorFn('Missing operation method.');

    const initPromise = fetchTree().then(assetTypeTree => {
        if (!trigger) {
            return syncAssetTypeTreeWithAssetTypes(assetTypeTree);
        } else {
            return handleTrigger(assetTypeTree, req).then(successFn, errorFn);
        }
    });

    switch (options?.METHOD) {
        case AssetTypeTreeMethod.GET_TREE:
            initPromise.then(assetTypeTree => AssetTypeTree.treeToString(assetTypeTree)).then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.GET_TOP_LEVEL_ASSET_TYPES:
            initPromise.then(assetTypeTree => getTopLevelAssetTypes(assetTypeTree)).then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.CREATE_ASSET_TYPE:
            initPromise
                .then(assetTypeTree => createAssetType(assetTypeTree, options.METHOD_OPTIONS))
                .then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.DELETE_ASSET_TYPE:
            initPromise
                .then(assetTypeTree => deleteAssetType(assetTypeTree, options.METHOD_OPTIONS))
                .then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.REMOVE_CHILD:
            initPromise
                .then(assetTypeTree => removeChild(assetTypeTree, options.METHOD_OPTIONS))
                .then(successFn, errorFn);
            break;
        case AssetTypeTreeMethod.ADD_CHILD:
            initPromise.then(assetTypeTree => addChild(assetTypeTree, options.METHOD_OPTIONS)).then(successFn, errorFn);
            break;
        default:
            if (!trigger) errorFn('Unsupported method provided.');
            break;
    }

    Promise.runQueue();
}
