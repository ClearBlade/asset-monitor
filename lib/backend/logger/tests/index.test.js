"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
describe('Logger', function () {
    it('createPrettyLogWithName', function () {
        expect(__1.createPrettyLogWithName({ name: 'myName' }, 'one', 'two')).toBe('myName one two');
    });
    it('prettLog', function () {
        expect(__1.prettyLog('one', 'two', 'three')).toBe('one two three');
    });
});
