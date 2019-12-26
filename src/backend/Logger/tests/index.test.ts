import { createPrettyLogWithName, prettyLog } from '..';

describe('Logger', () => {
    it('createPrettyLogWithName', () => {
        expect(createPrettyLogWithName({ name: 'myName' }, 'one', 'two')).toBe('myName one two');
    });

    it('prettLog', () => {
        expect(prettyLog('one', 'two', 'three')).toBe('one two three');
    });
});
