'use strict';
const assert = require('assert');
const { default: Executor } = require('../src/core/executor');

describe('CORE', () => {
    describe('#runLocalFile', () => {
        it('fibo functionshould return 120 when the value is 5', async () => {
            const res = await Executor.runLocalFile('./etc/fibo.wasm', 'main', { i: 5 });
            assert.strictEqual(res, 120);
        });
    });
});