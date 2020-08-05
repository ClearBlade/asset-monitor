import { AssetTypeTree } from '../assetTypeTree';

describe('Asset Type Tree', () => {
    describe('tree converts to and from JSON string', () => {
        const treeString = '{"vehicle":{"id":"vehicle","parents":[],"children":[]}}';
        let assetTypeTree: AssetTypeTree;

        it('tree initializes from JSON string', () => {
            assetTypeTree = AssetTypeTree.treeFromString(treeString);
            expect(assetTypeTree.nodes['vehicle']).toBeTruthy();
        });

        it('tree converts to JSON string', () => {
            const treeStringFromTree = AssetTypeTree.treeToString(assetTypeTree);
            expect(treeStringFromTree).toEqual(treeString);
        });
    });

    it('getTopLevelAssetTypeIDs returns only asset types without parents', () => {
        const treeString =
            '{"vehicle":{"id":"vehicle","parents":[],"children":["truck", "tractor"]},"truck":{"id":"truck","parents":["vehicle"],"children":[]},"tractor":{"id":"tractor","parents":["vehicle"],"children":[]},"building":{"id":"building","parents":[],"children":[]}}';
        const assetTypeTree = AssetTypeTree.treeFromString(treeString);

        expect(assetTypeTree.getTopLevelAssetTypeIDs().includes('vehicle')).toBeTruthy();
        expect(assetTypeTree.getTopLevelAssetTypeIDs().includes('building')).toBeTruthy();
        expect(assetTypeTree.getTopLevelAssetTypeIDs().includes('truck')).toBeFalsy();
        expect(assetTypeTree.getTopLevelAssetTypeIDs().includes('tractor')).toBeFalsy();
    });

    describe('add and delete asset type with no parents/children from tree', () => {
        let assetTypeTree: AssetTypeTree;

        beforeEach(() => {
            assetTypeTree = new AssetTypeTree();
        });

        it('add asset type to tree', () => {
            assetTypeTree.addAssetTypeToTree('type1');

            expect(assetTypeTree.nodes['type1']).toBeTruthy();
        });

        it('add existing asset type to tree throws error', () => {
            assetTypeTree.addAssetTypeToTree('type1');
            expect(() => {
                assetTypeTree.addAssetTypeToTree('type1');
            }).toThrowError();
        });

        it('delete exisiting asset type from tree', () => {
            assetTypeTree.addAssetTypeToTree('type1');
            assetTypeTree.deleteAssetTypeFromTree('type1');

            expect(assetTypeTree.nodes['type1']).toBeFalsy();
        });

        it('delete non-existent asset type from tree throws error', () => {
            expect(() => {
                assetTypeTree.deleteAssetTypeFromTree('type1');
            }).toThrowError();
        });
    });

    describe('add and remove child', () => {
        let assetTypeTree: AssetTypeTree;

        beforeEach(() => {
            const treeString =
                '{"vehicle":{"id":"vehicle","parents":[],"children":[]},"truck":{"id":"truck","parents":[],"children":[]},"tractor":{"id":"tractor","parents":[],"children":[]},"engine":{"id":"engine","parents":[],"children":[]}}';

            assetTypeTree = AssetTypeTree.treeFromString(treeString);
        });

        it('add child where parent == child throws error', () => {
            expect(() => {
                assetTypeTree.addChild('test', 'test');
            }).toThrowError();
        });

        it('add non-existent parent or child throws error', () => {
            expect(() => {
                assetTypeTree.addChild('vehicle', 'test');
            }).toThrowError();

            expect(() => {
                assetTypeTree.addChild('test', 'vehicle');
            }).toThrowError();
        });

        it('add child to parent where relationship already exists throws error', () => {
            assetTypeTree.addChild('truck', 'vehicle');
            expect(() => {
                assetTypeTree.addChild('truck', 'vehicle');
            }).toThrowError();
        });

        it('adds child to parent and updates parent/children connections', () => {
            assetTypeTree.addChild('truck', 'vehicle');

            expect(assetTypeTree.nodes['vehicle'].children.has('truck')).toBeTruthy();
            expect(assetTypeTree.nodes['truck'].parents.has('vehicle')).toBeTruthy();
        });

        it('removes child from parent and updates parent/children connections', () => {
            assetTypeTree.addChild('truck', 'vehicle');
            assetTypeTree.removeChild('truck', 'vehicle');

            expect(assetTypeTree.nodes['vehicle'].children.has('truck')).toBeFalsy();
            expect(assetTypeTree.nodes['truck'].parents.has('vehicle')).toBeFalsy();
        });

        it('prevents cycle on addChild and responds with error', () => {
            assetTypeTree.addChild('truck', 'vehicle');
            assetTypeTree.addChild('engine', 'truck');

            expect(() => {
                assetTypeTree.addChild('vehicle', 'engine');
            }).toThrowError();

            expect(() => {
                assetTypeTree.addChild('engine', 'engine');
            }).toThrowError();
        });
    });

    describe('delete node with parent/children', () => {
        it('delete asset type with parents and children removes connections', () => {
            const assetTypeTree = AssetTypeTree.treeFromString(
                '{"type1":{"id":"type1","parents":[],"children":["type2"]},"type2":{"id":"type2","parents":["type1"],"children":["type3"]},"type3":{"id":"type3","parents":["type2"],"children":[]}}',
            );

            assetTypeTree.deleteAssetTypeFromTree('type2');
            expect(assetTypeTree.nodes['type1'].children.has('type2')).toBeFalsy();
            expect(assetTypeTree.nodes['type3'].parents.has('type2')).toBeFalsy();
        });
    });
});
