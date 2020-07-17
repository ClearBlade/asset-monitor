import { tryParse } from '..';

describe('utils', () => {
    it('tryParse', () => {
        expect(tryParse('', [])).toEqual([]);
        expect(tryParse(null, [])).toEqual([]);
        expect(tryParse(undefined, {})).toEqual({});
        expect(tryParse(`{ "foo": "bar" }`, {})).toEqual({ foo: 'bar' });
        expect(tryParse(`[{ "foo": "bar" },{ "foo": "bar2" }]`, [])).toEqual([{ foo: 'bar' }, { foo: 'bar2' }]);
    });
});
