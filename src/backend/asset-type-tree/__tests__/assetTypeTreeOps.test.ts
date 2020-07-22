import {
    AssetTypeTree,
    CreateAssetTypeOptions,
    DeleteAssetTypeOptions,
    AddOrRemoveChildOptions,
    AssetTypeID,
} from '../assetTypeTreeOps';

const generateCreateOptions = (id: string, children?: string[]): CreateAssetTypeOptions => {
    return {
        ASSET_TYPE: {
            id: id,
        },
        CHILDREN: children,
    };
};

const generateDeleteOptions = (id: AssetTypeID): DeleteAssetTypeOptions => {
    return { ASSET_TYPE_ID: id };
};

const generateAddOrRemoveChildOptions = (childID: string, parentID: string): AddOrRemoveChildOptions => {
    return {
        CHILD_ID: childID,
        PARENT_ID: parentID,
    };
};

describe('Asset Type Tree', () => {
    const req = {
        params: {},
        context: {},
        systemKey: 'test',
        systemSecret: 'test',
        userToken: 'test',
        isLogging: true,
        userid: 'test',
        userEmail: 'test',
    };

    const resp: any = {
        error: (msg: unknown): void => undefined,
        success: (msg: unknown): void => undefined,
        send: (msg: unknown): void => undefined,
        set: (headers: object): void => undefined,
        status: (status_code: number) => undefined,
    };

    const updateAssetTypeTreeCollectionSpy = jest
        .spyOn(AssetTypeTree.prototype, 'updateAssetTypeTreeCollection')
        .mockImplementation(() => 'asset_type_tree updated');
    const syncAssetTypeTreeSpy = jest
        .spyOn(AssetTypeTree.prototype, 'syncAssetTypeTreeWithAssetTypes')
        .mockImplementation(() => 'asset_type_tree synced');
    const addToAssetTypesCollectionSpy = jest
        .spyOn(AssetTypeTree.prototype, 'addToAssetTypesCollection')
        .mockImplementation(() => 'asset_types updated');

    describe('tree converts to and from JSON string', () => {
        const treeString = '{"vehicle":{"id":"vehicle","parents":[],"children":[]}}';
        let assetTypeTree: AssetTypeTree;

        it('tree initializes from JSON string', () => {
            assetTypeTree = new AssetTypeTree('tree', req, resp, AssetTypeTree.treeFromString(treeString));
            expect(assetTypeTree.nodes['vehicle']).toBeTruthy();
        });

        it('tree converts to JSON string', () => {
            const treeStringFromTree = AssetTypeTree.treeToString(assetTypeTree.nodes);
            expect(treeStringFromTree).toEqual(treeString);
        });
    });

    it('getTopLevelNodeIDs returns only asset types without parents', () => {
        const treeString =
            '{"vehicle":{"id":"vehicle","parents":[],"children":["truck", "tractor"]},"truck":{"id":"truck","parents":["vehicle"],"children":[]},"tractor":{"id":"tractor","parents":["vehicle"],"children":[]},"building":{"id":"building","parents":[],"children":[]}}';
        const assetTypeTree = new AssetTypeTree('tree', req, resp, AssetTypeTree.treeFromString(treeString));

        expect(assetTypeTree.getTopLevelNodeIDs().includes('vehicle')).toBeTruthy();
        expect(assetTypeTree.getTopLevelNodeIDs().includes('building')).toBeTruthy();
        expect(assetTypeTree.getTopLevelNodeIDs().includes('truck')).toBeFalsy();
        expect(assetTypeTree.getTopLevelNodeIDs().includes('tractor')).toBeFalsy();
    });

    describe('create and delete parentless/childless node from tree', () => {
        let assetTypeTree: AssetTypeTree;
        let createOptions: CreateAssetTypeOptions;
        let deleteOptions: DeleteAssetTypeOptions;

        beforeEach(() => {
            createOptions = generateCreateOptions('vehicle');
            deleteOptions = generateDeleteOptions('vehicle');
            assetTypeTree = new AssetTypeTree('tree', req, resp);
        });

        it('creates asset type and adds to tree and to asset_types collection', () => {
            assetTypeTree.createAssetType(createOptions);

            expect(assetTypeTree.nodes[createOptions.ASSET_TYPE.id].id).toEqual(createOptions.ASSET_TYPE.id);
            expect(updateAssetTypeTreeCollectionSpy).toHaveBeenCalledTimes(1);
            expect(addToAssetTypesCollectionSpy).toHaveBeenCalledTimes(1);
        });

        it('deletes exisiting asset type from tree and updates asset_types collection', () => {
            assetTypeTree.createAssetType(createOptions);
            assetTypeTree.deleteAssetType(deleteOptions);

            expect(assetTypeTree.nodes[deleteOptions.ASSET_TYPE_ID]).toBeUndefined();
        });
    });

    describe('create and delete node with parent/children', () => {
        const assetTypeTree = new AssetTypeTree(
            'tree',
            req,
            resp,
            AssetTypeTree.treeFromString('{"train":{"id":"train","parents":[],"children":[]}}'),
        );

        it('create asset type with existing children and update connections', () => {
            const createOptions = generateCreateOptions('vehicle', ['train']);
            assetTypeTree.createAssetType(createOptions);

            expect(assetTypeTree.nodes['vehicle'].children.has('train')).toBeTruthy();
            expect(assetTypeTree.nodes['train'].parents.has('vehicle')).toBeTruthy();
        });

        it('delete asset type with children and update connections', () => {
            const deleteOptions = generateDeleteOptions('vehicle');
            assetTypeTree.deleteAssetType(deleteOptions);

            expect(assetTypeTree.nodes['vehicle']).toBeFalsy();
            expect(assetTypeTree.nodes['train'].parents.has('vehicle')).toBeFalsy();
        });

        it('create asset type with non-existent children does not create node or update connections', () => {
            const createOptions = generateCreateOptions('vehicle', ['truck', 'tractor']);
            assetTypeTree.createAssetType(createOptions);

            expect(assetTypeTree.nodes['vehicle']).toBeFalsy();
        });
    });

    describe('add and remove child', () => {
        let assetTypeTree: AssetTypeTree;
        let addChildOptions1: AddOrRemoveChildOptions;
        let addChildOptions2: AddOrRemoveChildOptions;
        let removeChildOptions: AddOrRemoveChildOptions;

        beforeEach(() => {
            const treeString =
                '{"vehicle":{"id":"vehicle","parents":[],"children":[]},"truck":{"id":"truck","parents":[],"children":[]},"tractor":{"id":"tractor","parents":[],"children":[]},"engine":{"id":"engine","parents":[],"children":[]}}';

            assetTypeTree = new AssetTypeTree('tree', req, resp, AssetTypeTree.treeFromString(treeString));

            addChildOptions1 = generateAddOrRemoveChildOptions('truck', 'vehicle');
            addChildOptions2 = generateAddOrRemoveChildOptions('tractor', 'vehicle');
            removeChildOptions = generateAddOrRemoveChildOptions('truck', 'vehicle');
        });

        it('adds child to parent and updates parent/children connections', () => {
            assetTypeTree.addChild(addChildOptions1);

            expect(assetTypeTree.nodes['vehicle'].children.has('truck')).toBeTruthy();
            expect(assetTypeTree.nodes['truck'].parents.has('vehicle')).toBeTruthy();
        });

        it('removes child from parent and updates parent/children connections', () => {
            assetTypeTree.addChild(addChildOptions1);
            assetTypeTree.removeChild(removeChildOptions);

            expect(assetTypeTree.nodes['vehicle'].children.has('truck')).toBeFalsy();
            expect(assetTypeTree.nodes['truck'].parents.has('vehicle')).toBeFalsy();
        });

        it('prevents cycle on addChild and responds with error', () => {
            const errorSpy = jest.spyOn(resp, 'error');

            const addChildOptions3 = generateAddOrRemoveChildOptions('engine', 'truck');
            const addChildOptions4 = generateAddOrRemoveChildOptions('engine', 'tractor');
            const addChildOptionsParentChildSame = generateAddOrRemoveChildOptions('vehicle', 'vehicle');
            const addChildOptionsCycle = generateAddOrRemoveChildOptions('engine', 'vehicle');

            assetTypeTree.addChild(addChildOptions1);
            assetTypeTree.addChild(addChildOptions2);
            assetTypeTree.addChild(addChildOptions3);
            assetTypeTree.addChild(addChildOptions4);

            assetTypeTree.addChild(addChildOptionsParentChildSame);
            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(assetTypeTree.nodes['vehicle'].children.has('vehicle')).toBeFalsy();
            expect(assetTypeTree.nodes['vehicle'].parents.has('vehicle')).toBeFalsy();

            assetTypeTree.addChild(addChildOptionsCycle);
            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(assetTypeTree.nodes['engine'].children.has('vehicle')).toBeFalsy();
        });
    });

    describe('trigger handles create/delete on asset_types collection and updates tree', () => {
        let assetTypeTree: AssetTypeTree;
        let req: any;
        it('asset type added to tree on trigger create', () => {
            req = {
                params: {
                    trigger: 'Data::ItemCreated',
                    items: [
                        {
                            id: 'vehicle',
                        },
                    ],
                },
                context: {},
                systemKey: 'test',
                systemSecret: 'test',
                userToken: 'test',
                isLogging: true,
                userid: 'test',
                userEmail: 'test',
            };

            assetTypeTree = new AssetTypeTree('tree', req, resp);
            expect(assetTypeTree.nodes['vehicle']).toBeTruthy();
            console.log(assetTypeTree.getTree());
        });

        it('asset type deleted from tree on trigger delete', () => {
            req.params.trigger = 'Data::ItemDeleted';
            assetTypeTree = new AssetTypeTree(
                'tree',
                req,
                resp,
                AssetTypeTree.treeFromString('{"vehicle":{"id":"vehicle","parents":[],"children":[]}}'),
            );
            expect(assetTypeTree.nodes['vehicle']).toBeFalsy();
        });
    });
});
