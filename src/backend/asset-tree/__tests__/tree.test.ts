import { AssetTree, AssetTreeNode } from '../tree';

describe('Asset Tree', () => {
    let asset1: AssetTreeNode;
    let asset2: AssetTreeNode;
    let asset3: AssetTreeNode;
    let asset4: AssetTreeNode;
    let assetTree: AssetTree;

    beforeEach(() => {
        asset1 = AssetTree.createAssetNode('asset1');
        asset2 = AssetTree.createAssetNode('asset2');
        asset3 = AssetTree.createAssetNode('asset3');
        asset4 = AssetTree.createAssetNode('asset4');

        assetTree = new AssetTree(asset1);
    });

    describe('adding child nodes', () => {
        it('add child node', () => {
            assetTree.addChildLeaf(asset2, 'asset1');
            
            expect(assetTree.nodes.get('asset2')).toEqual(asset2);
            expect(assetTree.nodes.get('asset1').children.has('asset2')).toBeTruthy();
            expect(assetTree.nodes.get('asset2').parentID === 'asset1').toBeTruthy();
        });

        it('add child node with non-existent parent throws error', () => {
            expect(() => {
                assetTree.addChildLeaf(asset2, 'fakeParent');
            }).toThrowError();
        });


        it('add child node with children throws error', () => {
            let nodeWithChildren = AssetTree.createAssetNode('node', undefined, new Set('asset2'));

            expect(() => {
                assetTree.addChildLeaf(nodeWithChildren, 'asset1');
            }).toThrowError();
        });
    
        it('add existing node throws error', () => {
            assetTree.addChildLeaf(asset2, 'asset1');
    
            expect(() => {
                assetTree.addChildLeaf(asset2, 'asset1');
            }).toThrowError();
        });
    });

    describe('get subtree IDs', () => {
        it('get subtree IDs of non-existent node throws error', () => {
            expect(() => {
                assetTree.getSubtreeIDs('fakeNode');
            }).toThrowError();
        });

        it('get subtree IDs', () => {
            assetTree.addChildLeaf(asset2, 'asset1');
            assetTree.addChildLeaf(asset3, 'asset2');
            assetTree.addChildLeaf(asset4, 'asset1');

            expect(['asset1', 'asset2', 'asset3', 'asset4'].every(assetID => assetTree.getSubtreeIDs('asset1').includes(assetID))).toBeTruthy();
            expect(['asset2', 'asset3'].every(assetID => assetTree.getSubtreeIDs('asset2').includes(assetID))).toBeTruthy();
            expect(['asset1', 'asset4'].every(assetID => assetTree.getSubtreeIDs('asset2').includes(assetID))).toBeFalsy();

        });
    });

    describe('add child tree', () => {
        let childTree: AssetTree;

        beforeEach(() => {
            childTree = new AssetTree(asset2);
            childTree.addChildLeaf(asset3, 'asset2');
            childTree.addChildLeaf(asset4, 'asset3');
        });

        it('add child tree containing asset already in parent tree throws error', () => {
            expect(() => {
                assetTree.addChildLeaf(asset2, 'asset1');
                assetTree.addChildTree(childTree, 'asset1');
            }).toThrowError();
        });

        it('add child tree to non-existent parent throws error', () => {
            expect(() => {
                assetTree.addChildTree(childTree, 'fakeParent');
            }).toThrowError();
        });

        it('add child tree missing root node throws error', () => {
            childTree.nodes.delete('asset2');
            expect(() => {
                assetTree.addChildTree(childTree, 'asset1');
            }).toThrowError();
        });

        it('add child tree updates parent/child connections', () => {
            assetTree.addChildTree(childTree, 'asset1');

            expect(assetTree.nodes.get('asset1').children.has('asset2')).toBeTruthy();
            expect(assetTree.nodes.get('asset2').parentID).toEqual('asset1');
            ['asset2', 'asset3', 'asset4'].every(assetID => {
                expect(assetTree.nodes.get(assetID)).toBeTruthy();
            });
        });

    });

    describe('removing child nodes', () => {
        it('remove root throws error', () => {
            expect(() => {
                assetTree.removeChild('asset1');
            }).toThrowError();
        });

        it('remove non-existent node throws error', () => {
            expect(() => {
                assetTree.removeChild('fakeChild');
            }).toThrowError();
        });

        it('remove child with non-existent parent throws error', () => {
            expect(() => {
                assetTree.addChildLeaf(asset2, 'fakeParent');
                assetTree.removeChild('asset2');
            }).toThrowError();
        });

        it('remove child with non-existent child throws error', () => {
            expect(() => {
                asset2.children.add('fakeChild');
                assetTree.addChildLeaf(asset2, 'asset1');
                assetTree.removeChild('asset2');
            }).toThrowError();
        });

        it('remove child removes child from tree and returns new tree with node', () => {
            assetTree.addChildLeaf(asset2, 'asset1');
            const newTree = assetTree.removeChild('asset2');

            expect(assetTree.nodes.has('asset2')).toBeFalsy();
            expect(assetTree.nodes.get('asset1').children.has('asset2')).toBeFalsy();
            expect(newTree.nodes.has('asset2')).toBeTruthy();
            expect(newTree.nodes.get('asset2').parentID).toBeFalsy();
        });

        it('remove child subtree returns subtree as new tree', () => {
            const childTree = new AssetTree(asset2);
            childTree.addChildLeaf(asset3, 'asset2');
            assetTree.addChildTree(childTree, 'asset1');

            const newTree = assetTree.removeChild('asset2');

            expect(assetTree.nodes.has('asset2')).toBeFalsy();
            expect(assetTree.nodes.has('asset3')).toBeFalsy();
            expect(newTree.nodes.has('asset2')).toBeTruthy();
            expect(newTree.nodes.has('asset3')).toBeTruthy();
        });
    });

    describe('stringify and parse tree', () => {
        beforeEach(() => {
            assetTree.addChildLeaf(asset2, 'asset1');
            assetTree.addChildLeaf(asset3, 'asset2');
            assetTree.addChildLeaf(asset4, 'asset2');
        });

        it('convert tree to and from JSON string', () => {
            const treeStr = AssetTree.treeToString(assetTree);
            const tree = AssetTree.treeFromString(treeStr);

            expect(tree instanceof AssetTree).toBeTruthy();
        });
    });
});
